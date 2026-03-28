import { Router, type RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  updateBrandVoice,
  getAnalytics,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authMiddleware as unknown as RequestHandler);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
 *   put:
 *     summary: Update user name/email
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Updated user }
 */
router.get("/profile", getProfile as unknown as RequestHandler);
router.put("/profile", updateProfile as unknown as RequestHandler);

/**
 * @swagger
 * /user/brand-voice:
 *   put:
 *     summary: Update brand voice settings
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultTone: { type: string }
 *               customToneInstructions: { type: string }
 *               brandName: { type: string }
 *     responses:
 *       200: { description: Updated user }
 */
router.put("/brand-voice", updateBrandVoice as unknown as RequestHandler);

/**
 * @swagger
 * /user/analytics:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Analytics data (products, generations, SEO scores, cost, etc.) }
 */
router.get("/analytics", getAnalytics as unknown as RequestHandler);

export default router;
