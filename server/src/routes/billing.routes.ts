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
router.get("/plans", getPlans as unknown as RequestHandler);
router.post(
  "/subscribe",
  authMiddleware as unknown as RequestHandler,
  validate(subscribeSchema) as unknown as RequestHandler,
  createCheckoutSession as unknown as RequestHandler
);
router.post(
  "/portal",
  authMiddleware as unknown as RequestHandler,
  createPortalSession as unknown as RequestHandler
);
router.get(
  "/usage",
  authMiddleware as unknown as RequestHandler,
  getUsage as unknown as RequestHandler
);

export default router;
