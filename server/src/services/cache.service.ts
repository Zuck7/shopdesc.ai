import crypto from "node:crypto";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const CACHE_PREFIX = "gen:";
const CACHE_TTL = 24 * 60 * 60; // 24 hours

/** Build a deterministic hash from product data + generation settings */
export function buildCacheKey(
  productId: string,
  platform: string,
  tone: string,
  includeCompetitor: boolean
): string {
  const raw = JSON.stringify({ productId, platform, tone, includeCompetitor });
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `${CACHE_PREFIX}${hash}`;
}

export async function getCachedGeneration(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    logger.error("Cache get error:", err);
    return null;
  }
}

export async function setCachedGeneration(
  key: string,
  generationId: string
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, generationId, "EX", CACHE_TTL);
  } catch (err) {
    logger.error("Cache set error:", err);
  }
}
