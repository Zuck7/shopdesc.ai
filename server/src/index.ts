import "dotenv/config";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import { startGenerationWorker } from "./workers/generation.worker.js";

const start = async () => {
  await connectDB();

  // Start BullMQ worker for bulk generation
  startGenerationWorker();

  app.listen(env.PORT, () => {
    logger.info(
      `Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });
};

start().catch((err: unknown) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
