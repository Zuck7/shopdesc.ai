import "dotenv/config";
import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import { startGenerationWorker } from "./workers/generation.worker.js";

// Initialise Sentry before anything else
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    enabled: env.NODE_ENV !== "test",
  });
  logger.info("Sentry initialised");
}

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
