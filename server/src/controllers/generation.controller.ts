import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { products, generations, bulkJobs, type Platform, type Tone } from "../models/schema.js";
import { logger } from "../utils/logger.js";
import {
  callGenerateSingle,
  type SingleGeneratePayload,
} from "../services/agentClient.js";
import { generationQueue } from "../config/queue.js";
import type { BulkJobData } from "../workers/generation.worker.js";
import {
  buildCacheKey,
  getCachedGeneration,
  setCachedGeneration,
} from "../services/cache.service.js";

// POST /api/generate/single/:productId
export const generateSingle = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = req.params.productId as string;

    // Fetch product
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.userId, userId)))
      .limit(1);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const {
      platform = "generic",
      tone = "professional",
      custom_tone_instructions,
      include_competitor_analysis = false,
    } = req.body;

    // Check cache
    const cacheKey = buildCacheKey(
      productId as string,
      platform,
      tone,
      include_competitor_analysis
    );
    const cachedId = await getCachedGeneration(cacheKey);
    if (cachedId) {
      const [cached] = await db
        .select()
        .from(generations)
        .where(eq(generations.id, cachedId))
        .limit(1);
      if (cached) {
        logger.info(`Cache hit for product ${productId}`);
        res.json(cached);
        return;
      }
    }

    // Build agent payload
    const payload: SingleGeneratePayload = {
      product: {
        name: product.name,
        category: product.category ?? undefined,
        features: product.features || [],
        price: product.price ? Number(product.price) : undefined,
        currency: product.currency || "USD",
        brand: product.brand ?? undefined,
        images: product.images || [],
        raw_description: undefined,
        raw_data: product.rawData as Record<string, unknown> | undefined,
      },
      platform,
      tone,
      custom_tone_instructions,
      include_competitor_analysis,
    };

    // Call Python agent service
    const result = await callGenerateSingle(payload);

    // Cost estimate: ~$0.003 per 1k tokens for gpt-4o-mini, ~$0.01 for gpt-4o
    const costEstimate = Number(
      (result.total_tokens_used * 0.000005).toFixed(6)
    );

    // Save Generation record
    const [generation] = await db
      .insert(generations)
      .values({
        userId,
        productId: product.id,
        platform,
        tone,
        productBrief: result.product_brief as unknown as Record<string, unknown>,
        seoStrategy: result.seo_strategy as unknown as Record<string, unknown>,
        competitorAnalysis: (result.competitor_analysis ?? undefined) as unknown as Record<string, unknown> | undefined,
        variants: result.variants.map((v) => ({
          variantLabel: v.variant_label,
          title: v.title,
          description: v.description,
          metaTitle: v.meta_title,
          metaDescription: v.meta_description,
          keywords: v.keywords,
          bulletPoints: v.bullet_points,
          seoScore: v.seo_score,
          readabilityScore: v.readability_score,
          wordCount: v.word_count,
          status: "generated" as const,
        })),
        totalTokensUsed: result.total_tokens_used,
        costEstimate,
        processingTimeMs: result.processing_time_ms,
      })
      .returning();

    logger.info(
      `Generation saved: ${generation!.id} for product ${productId} — ${result.total_tokens_used} tokens`
    );

    // Cache the generation
    await setCachedGeneration(cacheKey, generation!.id);

    res.status(201).json(generation);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    logger.error("generateSingle error:", error);
    res.status(500).json({ message: "Generation failed", error: errMsg });
  }
};

// GET /api/generations/:productId
export const getGenerations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = req.params.productId as string;

    const rows = await db
      .select()
      .from(generations)
      .where(and(eq(generations.userId, userId), eq(generations.productId, productId)))
      .orderBy(desc(generations.createdAt));

    res.json(rows);
  } catch (error) {
    logger.error("getGenerations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/generations/detail/:id
export const getGenerationDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [generation] = await db
      .select({
        generation: generations,
        productName: products.name,
        productCategory: products.category,
        productBrand: products.brand,
      })
      .from(generations)
      .leftJoin(products, eq(generations.productId, products.id))
      .where(and(eq(generations.id, req.params.id as string), eq(generations.userId, userId)))
      .limit(1);

    if (!generation) {
      res.status(404).json({ message: "Generation not found" });
      return;
    }

    res.json({
      ...generation.generation,
      product: {
        name: generation.productName,
        category: generation.productCategory,
        brand: generation.productBrand,
      },
    });
  } catch (error) {
    logger.error("getGenerationDetail error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/generate/bulk — create a bulk generation job
export const generateBulk = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      productIds: reqProductIds,
      platform = "generic",
      tone = "professional",
      custom_tone_instructions,
      include_competitor_analysis = false,
    } = req.body;

    if (!Array.isArray(reqProductIds) || reqProductIds.length === 0) {
      res.status(400).json({ message: "productIds array is required" });
      return;
    }

    if (reqProductIds.length > 500) {
      res.status(400).json({ message: "Maximum 500 products per bulk job" });
      return;
    }

    // Queue availability check before writing a queued job to DB
    if (!generationQueue) {
      res
        .status(503)
        .json({ message: "Bulk generation unavailable — Redis not connected" });
      return;
    }

    // Verify all products belong to user
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(inArray(products.id, reqProductIds), eq(products.userId, userId)));

    if ((countRow?.count ?? 0) !== reqProductIds.length) {
      res
        .status(400)
        .json({ message: "Some product IDs are invalid or not owned by you" });
      return;
    }

    // Create BulkJob
    const [bulkJob] = await db
      .insert(bulkJobs)
      .values({
        userId,
        platform: platform as Platform,
        tone: tone as Tone,
        includeCompetitor: include_competitor_analysis,
        productIds: reqProductIds,
        totalProducts: reqProductIds.length,
      })
      .returning();

    const jobData: BulkJobData = {
      bulkJobId: bulkJob!.id,
      userId,
      productIds: reqProductIds,
      platform,
      tone,
      customToneInstructions: custom_tone_instructions,
      includeCompetitor: include_competitor_analysis,
    };

    try {
      await generationQueue.add(`bulk-${bulkJob!.id}`, jobData);
    } catch (queueError) {
      await db
        .update(bulkJobs)
        .set({
          status: "failed",
          failedProducts: reqProductIds.length,
          completedAt: new Date(),
        })
        .where(eq(bulkJobs.id, bulkJob!.id));

      logger.error(
        `Failed to enqueue bulk job ${bulkJob!.id}`,
        queueError
      );

      res.status(503).json({
        message: "Bulk generation unavailable — queue enqueue failed",
      });
      return;
    }

    logger.info(
      `Bulk job ${bulkJob!.id} queued: ${reqProductIds.length} products`
    );

    res.status(201).json(bulkJob);
  } catch (error) {
    logger.error("generateBulk error:", error);
    res.status(500).json({ message: "Failed to create bulk job" });
  }
};

// GET /api/generate/jobs/:jobId — get bulk job status / progress
export const getJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [job] = await db
      .select()
      .from(bulkJobs)
      .where(and(eq(bulkJobs.id, req.params.jobId as string), eq(bulkJobs.userId, userId)))
      .limit(1);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json(job);
  } catch (error) {
    logger.error("getJobStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/generate/jobs — list user's bulk jobs
export const listJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobs = await db
      .select()
      .from(bulkJobs)
      .where(eq(bulkJobs.userId, userId))
      .orderBy(desc(bulkJobs.createdAt))
      .limit(50);

    res.json(jobs);
  } catch (error) {
    logger.error("listJobs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/generations/export — export generations as CSV or JSON
export const exportGenerations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { generationIds, format = "csv" } = req.body;

    if (!Array.isArray(generationIds) || generationIds.length === 0) {
      res.status(400).json({ message: "generationIds array is required" });
      return;
    }

    const rows = await db
      .select({
        generation: generations,
        productName: products.name,
      })
      .from(generations)
      .leftJoin(products, eq(generations.productId, products.id))
      .where(and(inArray(generations.id, generationIds), eq(generations.userId, userId)));

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=generations.json"
      );
      res.json(rows.map((r) => ({ ...r.generation, productName: r.productName })));
      return;
    }

    // CSV format
    const csvRows: string[] = [];
    csvRows.push(
      [
        "Product Name",
        "Platform",
        "Tone",
        "Variant",
        "Title",
        "Description",
        "Meta Title",
        "Meta Description",
        "Keywords",
        "Bullet Points",
        "SEO Score",
        "Readability Score",
        "Word Count",
      ].join(",")
    );

    for (const row of rows) {
      const gen = row.generation;
      const productName = row.productName ?? "Unknown";

      for (const v of gen.variants) {
        csvRows.push(
          [
            csvEscape(productName),
            gen.platform,
            gen.tone,
            v.variantLabel,
            csvEscape(v.title),
            csvEscape(v.description),
            csvEscape(v.metaTitle ?? ""),
            csvEscape(v.metaDescription ?? ""),
            csvEscape(v.keywords.join("; ")),
            csvEscape(v.bulletPoints.join("; ")),
            v.seoScore ?? "",
            v.readabilityScore ?? "",
            v.wordCount,
          ].join(",")
        );
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=generations.csv"
    );
    res.send(csvRows.join("\n"));
  } catch (error) {
    logger.error("exportGenerations error:", error);
    res.status(500).json({ message: "Export failed" });
  }
};

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
