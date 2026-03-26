import { rateLimit } from "express-rate-limit";

/** Strict rate limiter for generation endpoints: 10 requests per 15 minutes per IP */
export const generationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many generation requests — please try again later",
  },
});

/** Moderate rate limiter for bulk endpoints: 3 bulk jobs per 15 minutes per IP */
export const bulkRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many bulk generation requests — please try again later",
  },
});
