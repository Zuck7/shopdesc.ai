import { Router, type RequestHandler } from "express";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { subscribeSchema } from "../validators/billing.validator.js";
import {
  getPlans,
  createCheckoutSession,
  createPortalSession,
  getUsage,
  handleWebhook,
} from "../controllers/billing.controller.js";

const router = Router();

// Webhook must use raw body — mount before json parsing
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook as unknown as RequestHandler
);

// Authenticated routes

/**
 * @swagger
 * /billing/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Billing]
 *     responses:
 *       200: { description: Array of plans, content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Plan' } } } } }
 */
router.get("/plans", getPlans as unknown as RequestHandler);

/**
 * @swagger
 * /billing/subscribe:
 *   post:
 *     summary: Create a Stripe checkout session
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string, enum: [starter, pro, enterprise] }
 *     responses:
 *       200: { description: Checkout session URL }
 */
router.post(
  "/subscribe",
  authMiddleware as unknown as RequestHandler,
  validate(subscribeSchema) as unknown as RequestHandler,
  createCheckoutSession as unknown as RequestHandler
);

/**
 * @swagger
 * /billing/portal:
 *   post:
 *     summary: Create a Stripe billing portal session
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Portal session URL }
 */
router.post(
  "/portal",
  authMiddleware as unknown as RequestHandler,
  createPortalSession as unknown as RequestHandler
);

/**
 * @swagger
 * /billing/usage:
 *   get:
 *     summary: Get current plan usage
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Usage data with plan/limit/count }
 */
router.get(
  "/usage",
  authMiddleware as unknown as RequestHandler,
  getUsage as unknown as RequestHandler
);

export default router;
