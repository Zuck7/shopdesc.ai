/**
 * Shopify OAuth controllers.
 *
 * FLOW OVERVIEW
 * ─────────────
 * 1. POST /api/auth/shopify/preauth  (authenticated)
 *    - Verifies the logged-in user's JWT (via authMiddleware on the route).
 *    - Generates a random nonce.
 *    - Signs a short-lived httpOnly cookie that binds nonce + userId + shop.
 *    - Returns the Shopify authorization URL for the client to navigate to.
 *
 * 2. (browser navigates to Shopify, merchant grants permissions)
 *
 * 3. GET /api/auth/shopify/callback
 *    - Shopify redirects here with ?shop=…&code=…&state=…&hmac=…&timestamp=…
 *    - We read the signed cookie set in step 1.
 *    - Validate state (CSRF protection) + shop (anti-swap) + HMAC (anti-forgery)
 *      + timestamp (anti-replay).
 *    - Exchange code → permanent offline access token.
 *    - Persist shopifyDomain + shopifyAccessToken on the User document.
 *    - Redirect client back to the import page with a success flag.
 *
 * WHY A SIGNED COOKIE INSTEAD OF SESSION STORAGE?
 *   The OAuth round-trip leaves our domain; we can't keep state in memory.
 *   An httpOnly signed JWT cookie is invisible to JavaScript (XSS-safe) and
 *   signed with JWT_SECRET so it can't be tampered with (forge-safe).
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { users } from "../models/schema.js";
import { logger } from "../utils/logger.js";
import {
  validateShopDomain,
  buildAuthUrl,
  validateHmac,
  exchangeToken,
} from "../services/shopify.service.js";

/** Name of the short-lived state cookie used during the OAuth round-trip. */
const AUTH_COOKIE = "shopify_auth";
/** Cookie TTL — generous enough for a slow merchant, short enough to limit exposure. */
const COOKIE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

interface ShopifyAuthCookiePayload {
  nonce: string;
  userId: string;
  shop: string;
}

// ---------------------------------------------------------------------------
// POST /api/auth/shopify/preauth  (requires authMiddleware on route)
// ---------------------------------------------------------------------------

export const preauth = (req: AuthRequest, res: Response): void => {
  const { shop } = req.body as { shop?: string };

  if (!shop) {
    res.status(400).json({ message: "Missing shop parameter" });
    return;
  }

  if (!validateShopDomain(shop)) {
    res
      .status(400)
      .json({ message: "Invalid shop domain. Use the format: mystore.myshopify.com" });
    return;
  }

  if (!env.SHOPIFY_API_KEY || !env.SHOPIFY_API_SECRET || !env.SHOPIFY_CALLBACK_URL) {
    res.status(503).json({ message: "Shopify integration is not configured on this server" });
    return;
  }

  // Cryptographically random nonce — this is what we match against `state`
  // in the callback to confirm the request originated here.
  const nonce = crypto.randomBytes(16).toString("hex");

  // Pack nonce + userId + shop into a signed JWT stored in an httpOnly cookie.
  // The httpOnly flag keeps it invisible to client-side JS (XSS protection).
  // The signature prevents tampering (forgery protection).
  const cookieToken = jwt.sign(
    { nonce, userId: req.user!.id, shop } satisfies ShopifyAuthCookiePayload,
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  res.cookie(AUTH_COOKIE, cookieToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax", // must be "lax" (not "strict") — the callback is a cross-site redirect
    maxAge: COOKIE_MAX_AGE_MS,
  });

  res.json({ authUrl: buildAuthUrl(shop, nonce) });
};

// ---------------------------------------------------------------------------
// GET /api/auth/shopify/callback  (public — called by Shopify redirect)
// ---------------------------------------------------------------------------

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  /** Redirect to the client import page with an error code instead of crashing. */
  const fail = (reason: string): void => {
    res.redirect(`${env.CLIENT_URL}/products/import?shopify_error=${reason}`);
  };

  try {
    const { shop, code, state } = req.query as Record<string, string>;
    const cookieToken = (req.cookies as Record<string, string | undefined>)[AUTH_COOKIE];

    // Always clear the cookie — whether validation succeeds or fails.
    res.clearCookie(AUTH_COOKIE);

    // ── 1. Verify the signed state cookie ───────────────────────────────────
    if (!cookieToken) { fail("missing_state"); return; }

    let cookiePayload: ShopifyAuthCookiePayload;
    try {
      cookiePayload = jwt.verify(cookieToken, env.JWT_SECRET) as ShopifyAuthCookiePayload;
    } catch {
      fail("expired_state"); return;
    }

    // ── 2. CSRF check ────────────────────────────────────────────────────────
    // The `state` query param must match the nonce we originally generated.
    // This confirms the callback was initiated by _us_, not a third party.
    if (!state || state !== cookiePayload.nonce) { fail("invalid_state"); return; }

    // ── 3. Shop-swap protection ──────────────────────────────────────────────
    // Ensure the shop Shopify sent back is the same one the user started with.
    if (!shop || shop !== cookiePayload.shop || !validateShopDomain(shop)) {
      fail("invalid_shop"); return;
    }

    // ── 4. HMAC validation ───────────────────────────────────────────────────
    // Proves the callback URL was generated by Shopify, not an attacker.
    // Also validates the timestamp (anti-replay, see shopify.service.ts).
    if (!validateHmac(req.query as Record<string, string>)) {
      fail("invalid_hmac"); return;
    }

    // ── 5. Token exchange ────────────────────────────────────────────────────
    const accessToken = await exchangeToken(shop, code!);

    // ── 6. Persist Shopify credentials on the user record ───────────────────
    const [updated] = await db
      .update(users)
      .set({ shopifyDomain: shop, shopifyAccessToken: accessToken, updatedAt: new Date() })
      .where(eq(users.id, cookiePayload.userId))
      .returning({ id: users.id });

    if (!updated) { fail("user_not_found"); return; }

    // ── 7. Redirect back to the client ───────────────────────────────────────
    // The user is still logged in with their existing JWT — no re-auth needed.
    // The import page detects ?shopify=connected and refreshes the user record.
    res.redirect(`${env.CLIENT_URL}/products/import?shopify=connected`);
  } catch (error) {
    logger.error("Shopify callback error:", error);
    fail("server_error");
  }
};
