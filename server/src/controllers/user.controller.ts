import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { users, products, generations } from "../models/schema.js";
import { logger } from "../utils/logger.js";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      brandName: user.brandName,
      defaultTone: user.defaultTone,
      customToneInstructions: user.customToneInstructions,
      monthlyGenerations: user.monthlyGenerations,
      generationLimit: user.generationLimit,
      usageResetDate: user.usageResetDate,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, brandName } = req.body as {
      name?: string;
      brandName?: string;
    };

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (name) update.name = name;
    if (brandName !== undefined) update.brandName = brandName;

    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, req.user!.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        plan: users.plan,
        brandName: users.brandName,
        defaultTone: users.defaultTone,
        customToneInstructions: users.customToneInstructions,
      });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBrandVoice = async (req: AuthRequest, res: Response) => {
  try {
    const { defaultTone, customToneInstructions } = req.body as {
      defaultTone?: string;
      customToneInstructions?: string;
    };

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (defaultTone) update.defaultTone = defaultTone;
    if (customToneInstructions !== undefined)
      update.customToneInstructions = customToneInstructions;

    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, req.user!.id))
      .returning({
        defaultTone: users.defaultTone,
        customToneInstructions: users.customToneInstructions,
      });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error("Update brand voice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [[productCountRow], [genCountRow], genRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(generations).where(eq(generations.userId, userId)),
      db.select().from(generations).where(eq(generations.userId, userId)).orderBy(desc(generations.createdAt)).limit(1000),
    ]);

    const totalProducts = productCountRow?.count ?? 0;
    const totalGenerations = genCountRow?.count ?? 0;

    // Average SEO score (from variants)
    const seoScores: number[] = [];
    for (const g of genRows) {
      for (const v of g.variants ?? []) {
        if (typeof v.seoScore === "number") seoScores.push(v.seoScore);
      }
    }
    const avgSeoScore =
      seoScores.length > 0
        ? seoScores.reduce((a, b) => a + b, 0) / seoScores.length
        : 0;

    // Total cost
    const totalCost = genRows.reduce(
      (sum, g) => sum + Number(g.costEstimate ?? 0),
      0
    );

    // Generations by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const g of genRows) {
      const day = new Date(g.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    const generationsByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // SEO score distribution
    const ranges = [
      { range: "0-20", min: 0, max: 20 },
      { range: "21-40", min: 21, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ];
    const seoScoreDistribution = ranges.map(({ range, min, max }) => ({
      range,
      count: seoScores.filter((s) => s >= min && s <= max).length,
    }));

    // Platform breakdown
    const platformMap = new Map<string, number>();
    for (const g of genRows) {
      const p = g.platform ?? "unknown";
      platformMap.set(p, (platformMap.get(p) ?? 0) + 1);
    }
    const platformBreakdown = Array.from(platformMap.entries()).map(
      ([platform, count]) => ({ platform, count })
    );

    res.json({
      totalProducts,
      totalGenerations,
      avgSeoScore,
      totalCost,
      generationsByDay,
      seoScoreDistribution,
      platformBreakdown,
    });
  } catch (error) {
    logger.error("Analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
