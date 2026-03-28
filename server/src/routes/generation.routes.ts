import { Router, type RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  generationRateLimiter,
  bulkRateLimiter,
} from "../middleware/rateLimiter.js";
import {
  generateSingle,
  generateBulk,
  getJobStatus,
  listJobs,
  getGenerations,
  getGenerationDetail,
  exportGenerations,
} from "../controllers/generation.controller.js";

const router = Router();

// All generation routes require auth
router.use(authMiddleware as unknown as RequestHandler);

// POST /api/generate/single/:productId — generate content for a single product
router.post(
  "/single/:productId",
  generationRateLimiter as unknown as RequestHandler,
  generateSingle as unknown as RequestHandler
);

// POST /api/generate/bulk — create bulk generation job
router.post(
  "/bulk",
  bulkRateLimiter as unknown as RequestHandler,
  generateBulk as unknown as RequestHandler
);

// GET /api/generate/jobs — list bulk jobs
router.get("/jobs", listJobs as unknown as RequestHandler);

// GET /api/generate/jobs/:jobId — get bulk job status/progress
router.get("/jobs/:jobId", getJobStatus as unknown as RequestHandler);

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

// POST /api/generations/export — export generations as CSV or JSON
router.post(
  "/export",
  exportGenerations as unknown as RequestHandler
);

export default router;
