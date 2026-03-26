import { Router, type RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  generateSingle,
  getGenerations,
  getGenerationDetail,
} from "../controllers/generation.controller.js";

const router = Router();

// All generation routes require auth
router.use(authMiddleware as unknown as RequestHandler);

// POST /api/generate/single/:productId — generate content for a single product
router.post(
  "/single/:productId",
  generateSingle as unknown as RequestHandler
);

// GET /api/generations/:productId — list all generations for a product
router.get(
  "/:productId",
  getGenerations as unknown as RequestHandler
);

// GET /api/generations/detail/:id — get a single generation with full detail
router.get(
  "/detail/:id",
  getGenerationDetail as unknown as RequestHandler
);

export default router;
