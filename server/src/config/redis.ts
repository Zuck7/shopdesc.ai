import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redis: Redis | null = null;

if (env.REDIS_URL) {
  const instance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy() {
      return null; // never auto-retry
    },
  });

  instance.on("error", () => {});

  try {
    await instance.connect();
    redis = instance;
    logger.info("Redis connected");
  } catch {
    logger.warn("Redis connection failed — bulk generation and caching disabled");
    instance.disconnect();
  }
} else {
  logger.warn("REDIS_URL not set — running without Redis");
}

export { redis };
