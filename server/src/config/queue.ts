import { Queue } from "bullmq";
import { redis } from "./redis.js";

// Cast through unknown — bullmq bundles its own ioredis typings
export const generationQueue = new Queue("generation", {
  connection: redis as unknown as import("bullmq").ConnectionOptions,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 7 * 24 * 3600 }, // keep 7 days
    removeOnFail: { age: 14 * 24 * 3600 },
  },
});
