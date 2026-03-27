import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Generation from "../models/Generation.js";
import BulkJob from "../models/BulkJob.js";
import User from "../models/User.js";
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
    const userId = req.user!._id;
    const { productId } = req.params;

    // Fetch product
    const product = await Product.findOne({ _id: productId, userId }).lean();
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
      const cached = await Generation.findById(cachedId).lean();
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
        category: product.category,
        features: product.features || [],
        price: product.price,
        currency: product.currency || "USD",
        brand: product.brand,
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
    const costEstimate = result.total_tokens_used * 0.000005;

    // Save Generation document
    const generation = await Generation.create({
      userId,
      productId: product._id,
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
        status: "generated",
      })),
      totalTokensUsed: result.total_tokens_used,
      costEstimate,
      processingTimeMs: result.processing_time_ms,
    });

    logger.info(
      `Generation saved: ${generation._id} for product ${productId} — ${result.total_tokens_used} tokens`
    );

    // Cache the generation
    await setCachedGeneration(cacheKey, String(generation._id));

    // Increment usage counter
    await User.findByIdAndUpdate(userId, { $inc: { monthlyGenerations: 1 } });

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
    const userId = req.user!._id;
    const { productId } = req.params;

    const generations = await Generation.find({ userId, productId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(generations);
  } catch (error) {
    logger.error("getGenerations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/generations/detail/:id
export const getGenerationDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const generation = await Generation.findOne({
      _id: req.params.id,
      userId,
    })
      .populate("productId", "name category brand")
      .lean();

    if (!generation) {
      res.status(404).json({ message: "Generation not found" });
      return;
    }

    res.json(generation);
  } catch (error) {
    logger.error("getGenerationDetail error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/generate/bulk — create a bulk generation job
export const generateBulk = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const {
      productIds,
      platform = "generic",
      tone = "professional",
      custom_tone_instructions,
      include_competitor_analysis = false,
    } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ message: "productIds array is required" });
      return;
    }

    if (productIds.length > 500) {
      res.status(400).json({ message: "Maximum 500 products per bulk job" });
      return;
    }

    // Verify all products belong to user
    const count = await Product.countDocuments({
      _id: { $in: productIds },
      userId,
    });
    if (count !== productIds.length) {
      res
        .status(400)
        .json({ message: "Some product IDs are invalid or not owned by you" });
      return;
    }

    // Create BulkJob
    const bulkJob = await BulkJob.create({
      userId,
      platform,
      tone,
      includeCompetitor: include_competitor_analysis,
      productIds,
      totalProducts: productIds.length,
    });

    // Add to BullMQ queue
    const jobData: BulkJobData = {
      bulkJobId: String(bulkJob._id),
      userId: String(userId),
      productIds,
      platform,
      tone,
      customToneInstructions: custom_tone_instructions,
      includeCompetitor: include_competitor_analysis,
    };

    await generationQueue.add(`bulk-${bulkJob._id}`, jobData);

    logger.info(
      `Bulk job ${bulkJob._id} queued: ${productIds.length} products`
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
    const userId = req.user!._id;
    const job = await BulkJob.findOne({
      _id: req.params.jobId,
      userId,
    }).lean();

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
    const userId = req.user!._id;
    const jobs = await BulkJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(jobs);
  } catch (error) {
    logger.error("listJobs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/generations/export — export generations as CSV or JSON
export const exportGenerations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { generationIds, format = "csv" } = req.body;

    if (!Array.isArray(generationIds) || generationIds.length === 0) {
      res.status(400).json({ message: "generationIds array is required" });
      return;
    }

    const generations = await Generation.find({
      _id: { $in: generationIds },
      userId,
    })
      .populate("productId", "name category brand")
      .lean();

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=generations.json"
      );
      res.json(generations);
      return;
    }

    // CSV format
    const rows: string[] = [];
    rows.push(
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

    for (const gen of generations) {
      const productName =
        typeof gen.productId === "object" &&
        gen.productId !== null &&
        "name" in gen.productId
          ? (gen.productId as { name: string }).name
          : String(gen.productId);

      for (const v of gen.variants) {
        rows.push(
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
    res.send(rows.join("\n"));
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
