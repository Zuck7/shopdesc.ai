import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import User from "../models/User.js";

/**
 * Middleware that checks whether the user has remaining generation quota.
 * Also transparently resets the counter when a new billing period begins.
 */
export const planLimiter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;

    // Reset counter if the billing period has elapsed
    const now = new Date();
    if (now > user.usageResetDate) {
      const nextReset = new Date(now);
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      nextReset.setHours(0, 0, 0, 0);

      user.monthlyGenerations = 0;
      user.usageResetDate = nextReset;
      await User.findByIdAndUpdate(user._id, {
        monthlyGenerations: 0,
        usageResetDate: nextReset,
      });
    }

    if (user.monthlyGenerations >= user.generationLimit) {
      res.status(403).json({
        message: "Monthly generation limit reached. Please upgrade your plan.",
        plan: user.plan,
        used: user.monthlyGenerations,
        limit: user.generationLimit,
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ message: "Usage check failed" });
  }
};
