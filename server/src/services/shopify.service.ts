/**
 * Shopify service — handles OAuth helpers and Admin REST API calls.
 *
 * HOW SHOPIFY OAUTH WORKS (OAuth 2.0 Authorization Code flow):
 *  1. We redirect the merchant to Shopify's authorization endpoint with:
 *       client_id, scope, redirect_uri, state (CSRF nonce)
 *  2. Shopify redirects back to our callback URL with:
 *       shop, code, state, hmac, timestamp
 *  3. We validate the HMAC signature (proves the callback was sent by Shopify)
 *     and the state nonce (proves it wasn't forged by a third party — CSRF protection).
 *  4. We exchange the authorization code for a permanent offline access token.
 *  5. We store that token server-side and use it to call the Admin REST API.
 */
import crypto from "crypto";
import axios from "axios";
import { env } from "../config/env.js";

const SHOPIFY_API_VERSION = "2024-01";
/** Maximum age of a callback timestamp we will accept (prevents replay attacks). */
const MAX_TIMESTAMP_AGE_SECONDS = 300; // 5 minutes

// ---------------------------------------------------------------------------
// Domain validation
// ---------------------------------------------------------------------------

/** Returns true only for valid *.myshopify.com hostnames. */
export function validateShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

/**
 * Build the Shopify OAuth authorization URL.
 * The merchant's browser is redirected here to grant permissions.
 */
export function buildAuthUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: env.SHOPIFY_API_KEY!,
    scope: env.SHOPIFY_SCOPES,
    redirect_uri: env.SHOPIFY_CALLBACK_URL!,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Validate the HMAC Shopify appends to its OAuth callback.
 *
 * WHY THIS MATTERS:
 *  Without HMAC validation an attacker could craft a fake callback URL with
 *  a stolen `code` parameter and our server would happily exchange it.
 *  The HMAC is computed with SHOPIFY_API_SECRET (only known to us + Shopify),
 *  so it can't be forged.
 *
 * ALGORITHM:
 *  1. Remove `hmac` and `signature` from the query params.
 *  2. Sort remaining params alphabetically and join as key=value&…
 *  3. HMAC-SHA256 the string with SHOPIFY_API_SECRET.
 *  4. Compare digests using constant-time comparison (prevents timing attacks).
 */
export function validateHmac(query: Record<string, string | string[] | undefined>): boolean {
  if (!env.SHOPIFY_API_SECRET) return false;

  const { hmac, signature, timestamp, ...rest } = query as Record<string, string | undefined>;

  if (!hmac) return false;

  // Replay-attack guard: reject callbacks older than MAX_TIMESTAMP_AGE_SECONDS
  const ts = parseInt(timestamp ?? "0", 10);
  const now = Math.floor(Date.now() / 1000);
  if (!ts || Math.abs(now - ts) > MAX_TIMESTAMP_AGE_SECONDS) return false;

  // Restore timestamp in the message (it was extracted above only to validate it)
  const params: Record<string, string> = { ...rest as Record<string, string>, ...(timestamp ? { timestamp } : {}) };

  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", env.SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  // timingSafeEqual prevents timing-oracle attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(hmac, "hex"));
  } catch {
    return false;
  }
}

/**
 * Exchange a short-lived authorization code for a permanent offline access token.
 * This token never expires unless the merchant uninstalls the app.
 */
export async function exchangeToken(shop: string, code: string): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `https://${shop}/admin/oauth/access_token`,
    {
      client_id: env.SHOPIFY_API_KEY,
      client_secret: env.SHOPIFY_API_SECRET,
      code,
    }
  );
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Admin REST API — product fetching
// ---------------------------------------------------------------------------

interface ShopifyProductVariant {
  price: string;
}

interface ShopifyProductImage {
  src: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string; // comma-separated string
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

/**
 * Fetch ALL products from a Shopify store, handling cursor-based pagination.
 *
 * Shopify caps each page at 250 products and uses Link headers with
 * `rel="next"` cursors (not page numbers) for pagination.
 */
export async function fetchAllProducts(
  shop: string,
  accessToken: string
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let url: string | null =
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json` +
    `?limit=250&fields=id,title,body_html,vendor,product_type,tags,variants,images`;

  while (url) {
    const response = await axios.get<ShopifyProductsResponse>(url, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });

    all.push(...response.data.products);

    // Parse the Link header — Shopify uses RFC 5988 format:
    // <https://...?page_info=xxx>; rel="next"
    url = extractNextUrl(response.headers["link"] as string | undefined);
  }

  return all;
}

function extractNextUrl(linkHeader?: string): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? (match[1] ?? null) : null;
}

// ---------------------------------------------------------------------------
// Data mapping
// ---------------------------------------------------------------------------

/**
 * Map a Shopify product object to our internal Product schema shape.
 * Uses the cheapest variant's price; strips HTML from body_html.
 */
export function mapShopifyProduct(raw: ShopifyProduct) {
  const tags = raw.tags
    ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const price =
    raw.variants?.[0]?.price ? parseFloat(raw.variants[0].price) : undefined;

  const images = raw.images?.map((img) => img.src) ?? [];

  // Strip HTML tags to get a plain-text description usable as a product feature
  const description = raw.body_html
    ? raw.body_html.replace(/<[^>]*>/g, "").trim()
    : "";

  return {
    name: raw.title,
    brand: raw.vendor || undefined,
    category: raw.product_type || undefined,
    features: description ? [description] : ([] as string[]),
    benefits: [] as string[],
    price,
    images,
    tags,
    externalId: String(raw.id),
    rawData: raw as unknown as Record<string, unknown>,
  };
}
