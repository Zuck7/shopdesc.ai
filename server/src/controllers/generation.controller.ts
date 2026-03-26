import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Generation from "../models/Generation.js";
import { logger } from "../utils/logger.js";
import {
  callGenerateSingle,
  type SingleGeneratePayload,
} from "../services/agentClient.js";

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
