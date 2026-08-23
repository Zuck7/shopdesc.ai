import { Router, type RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { planLimiter } from "../middleware/planLimiter.js";
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

const generateRouter = Router();
const generationsRouter = Router();

// All generation routes require auth
generateRouter.use(authMiddleware as unknown as RequestHandler);
generationsRouter.use(authMiddleware as unknown as RequestHandler);

// POST /api/generate/single/:productId — generate content for a single product
generateRouter.post(
  "/single/:productId",
  generationRateLimiter as unknown as RequestHandler,
  planLimiter as unknown as RequestHandler,
  generateSingle as unknown as RequestHandler
);

// POST /api/generate/bulk — create bulk generation job
generateRouter.post(
  "/bulk",
  bulkRateLimiter as unknown as RequestHandler,
  planLimiter as unknown as RequestHandler,
  generateBulk as unknown as RequestHandler
);

// GET /api/generate/jobs — list bulk jobs
generateRouter.get("/jobs", listJobs as unknown as RequestHandler);

// GET /api/generate/jobs/:jobId — get bulk job status/progress
generateRouter.get("/jobs/:jobId", getJobStatus as unknown as RequestHandler);

// GET /api/generations/detail/:id — get a single generation with full detail
generationsRouter.get(
  "/detail/:id",
  getGenerationDetail as unknown as RequestHandler
);

// GET /api/generations/:productId — list all generations for a product
generationsRouter.get(
  "/:productId",
  getGenerations as unknown as RequestHandler
);

// POST /api/generations/export — export generations as CSV or JSON
generationsRouter.post(
  "/export",
  exportGenerations as unknown as RequestHandler
);

export { generateRouter, generationsRouter };
