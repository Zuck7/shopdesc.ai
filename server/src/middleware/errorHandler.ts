import type { ErrorRequestHandler } from "express";
import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  Sentry.captureException(err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
  });
};
