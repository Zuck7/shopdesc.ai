import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { env } from "../config/env.js";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import { preauth, handleCallback } from "../controllers/shopify.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", getMe);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    const user = req.user as any;
    const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    const refreshTkn = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );

    res.cookie("refreshToken", refreshTkn, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${env.CLIENT_URL}/auth/callback?token=${accessToken}`);
  }
);

// Shopify OAuth
// POST /api/auth/shopify/preauth — authenticated; returns the Shopify authorization URL
router.post(
  "/shopify/preauth",
  authMiddleware as unknown as import("express").RequestHandler,
  preauth as unknown as import("express").RequestHandler
);

// GET /api/auth/shopify/callback — called by Shopify after the merchant grants access
router.get("/shopify/callback", handleCallback as unknown as import("express").RequestHandler);

export default router;
