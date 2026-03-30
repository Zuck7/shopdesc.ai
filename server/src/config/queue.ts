import { Queue } from "bullmq";
import { redis } from "./redis.js";

// Only create queue if Redis is available
export const generationQueue = redis
  ? new Queue("generation", {
      connection: redis as unknown as import("bullmq").ConnectionOptions,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 7 * 24 * 3600 }, // keep 7 days
        removeOnFail: { age: 14 * 24 * 3600 },
      },
    })
  : null;
