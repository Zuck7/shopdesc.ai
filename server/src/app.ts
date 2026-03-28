import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import generationRoutes from "./routes/generation.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import userRoutes from "./routes/user.routes.js";

export const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body parsing — skip JSON for Stripe webhook (needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/billing/webhook") {
    next();
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/generate", generationRoutes);
app.use("/api/generations", generationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/user", userRoutes);

// Global error handler (must be last)
app.use(errorHandler);
