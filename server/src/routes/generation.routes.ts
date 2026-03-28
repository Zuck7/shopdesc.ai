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

const router = Router();

// All generation routes require auth
router.use(authMiddleware as unknown as RequestHandler);

/**
 * @swagger
 * /generate/single/{productId}:
 *   post:
 *     summary: Generate AI content for a single product
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform: { type: string, enum: [shopify, amazon, etsy, woocommerce, generic], default: generic }
 *               tone: { type: string, default: professional }
 *               includeCompetitorAnalysis: { type: boolean, default: false }
 *     responses:
 *       201: { description: Generated content, content: { application/json: { schema: { $ref: '#/components/schemas/Generation' } } } }
 *       402: { description: Plan limit reached }
 *       429: { description: Rate limited }
 */
router.post(
  "/single/:productId",
  generationRateLimiter as unknown as RequestHandler,
  planLimiter as unknown as RequestHandler,
  generateSingle as unknown as RequestHandler
);

/**
 * @swagger
 * /generate/bulk:
 *   post:
 *     summary: Create a bulk generation job
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productIds]
 *             properties:
 *               productIds: { type: array, items: { type: string }, maxItems: 500 }
 *               platform: { type: string, default: generic }
 *               tone: { type: string, default: professional }
 *     responses:
 *       201: { description: Bulk job created, content: { application/json: { schema: { $ref: '#/components/schemas/BulkJob' } } } }
 */
router.post(
  "/bulk",
  bulkRateLimiter as unknown as RequestHandler,
  planLimiter as unknown as RequestHandler,
  generateBulk as unknown as RequestHandler
);

/**
 * @swagger
 * /generate/jobs:
 *   get:
 *     summary: List bulk generation jobs
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of bulk jobs }
 */
router.get("/jobs", listJobs as unknown as RequestHandler);

/**
 * @swagger
 * /generate/jobs/{jobId}:
 *   get:
 *     summary: Get bulk job status and progress
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job details with progress }
 *       404: { description: Job not found }
 */
router.get("/jobs/:jobId", getJobStatus as unknown as RequestHandler);

/**
 * @swagger
 * /generations/{productId}:
 *   get:
 *     summary: List all generations for a product
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of generations }
 */
router.get(
  "/:productId",
  getGenerations as unknown as RequestHandler
);

/**
 * @swagger
 * /generations/detail/{id}:
 *   get:
 *     summary: Get a single generation with full detail
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Generation with populated product }
 *       404: { description: Generation not found }
 */
router.get(
  "/detail/:id",
  getGenerationDetail as unknown as RequestHandler
);

/**
 * @swagger
 * /generations/export:
 *   post:
 *     summary: Export generations as CSV or JSON
 *     tags: [Generation]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [generationIds, format]
 *             properties:
 *               generationIds: { type: array, items: { type: string } }
 *               format: { type: string, enum: [csv, json] }
 *     responses:
 *       200: { description: File download }
 */
router.post(
  "/export",
  exportGenerations as unknown as RequestHandler
);

export default router;
