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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201: { description: User created, content: { application/json: { schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' }, accessToken: { type: string } } } } } }
 *       409: { description: Email already exists }
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using cookie
 *     tags: [Auth]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: New access token }
 *       401: { description: No or invalid refresh token }
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and clear refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
 *       401: { description: Not authenticated }
 */
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
    const accessToken = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    const refreshTkn = jwt.sign(
      { userId: user._id },
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
