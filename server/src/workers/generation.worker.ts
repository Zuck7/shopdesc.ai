import { Worker, type Job } from "bullmq";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import Product from "../models/Product.js";
import Generation from "../models/Generation.js";
import BulkJob from "../models/BulkJob.js";
import {
  callGenerateSingle,
  type SingleGeneratePayload,
} from "../services/agentClient.js";

export interface BulkJobData {
  bulkJobId: string;
  userId: string;
  productIds: string[];
  platform: string;
  tone: string;
  customToneInstructions?: string;
  includeCompetitor: boolean;
}

async function processBulkGeneration(job: Job<BulkJobData>) {
  const {
    bulkJobId,
    userId,
    productIds,
    platform,
    tone,
    customToneInstructions,
    includeCompetitor,
  } = job.data;

  logger.info(
    `Worker starting bulk job ${bulkJobId}: ${productIds.length} products`
  );

  // Mark job as processing
  await BulkJob.findByIdAndUpdate(bulkJobId, {
    status: "processing",
    startedAt: new Date(),
  });

  let completed = 0;
  let failed = 0;

  for (const productId of productIds) {
    try {
      const product = await Product.findOne({
        _id: productId,
        userId,
      }).lean();
      if (!product) {
        failed++;
        continue;
      }

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
        custom_tone_instructions: customToneInstructions,
        include_competitor_analysis: includeCompetitor,
      };

      const result = await callGenerateSingle(payload);

      const costEstimate = result.total_tokens_used * 0.000005;

      await Generation.create({
        userId,
        productId: product._id,
        jobId: bulkJobId,
        platform,
        tone,
        productBrief: result.product_brief as unknown as Record<
          string,
          unknown
        >,
        seoStrategy: result.seo_strategy as unknown as Record<
          string,
          unknown
        >,
        competitorAnalysis: (result.competitor_analysis ??
          undefined) as unknown as Record<string, unknown> | undefined,
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
      });

      completed++;
    } catch (err) {
      logger.error(
        `Bulk job ${bulkJobId}: failed product ${productId}`,
        err
      );
      failed++;
    }

    // Update progress after each product
    await BulkJob.findByIdAndUpdate(bulkJobId, {
      completedProducts: completed,
      failedProducts: failed,
    });

    // Report BullMQ progress for consumers
    await job.updateProgress(
      Math.round(((completed + failed) / productIds.length) * 100)
    );
  }

  // Finalize
  const finalStatus =
    failed === productIds.length
      ? "failed"
      : "completed";

  await BulkJob.findByIdAndUpdate(bulkJobId, {
    status: finalStatus,
    completedProducts: completed,
    failedProducts: failed,
    completedAt: new Date(),
  });

  logger.info(
    `Bulk job ${bulkJobId} done: ${completed} completed, ${failed} failed`
  );

  return { completed, failed };
}

export function startGenerationWorker() {
  if (!redis) {
    logger.warn("Redis unavailable — generation worker disabled");
    return null;
  }

  const worker = new Worker<BulkJobData>(
    "generation",
    processBulkGeneration,
    {
      connection: redis as unknown as import("bullmq").ConnectionOptions,
      concurrency: 1, // process one bulk job at a time
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Generation job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Generation job ${job?.id} failed:`, err);
  });

  logger.info("Generation worker started");

  return worker;
}
