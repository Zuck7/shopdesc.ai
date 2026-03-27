import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import User from "../models/User.js";
import Generation from "../models/Generation.js";

// GET /api/user/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    _id: user._id,
    email: user.email,
    name: user.name,
    image: user.image,
    brandName: user.brandName,
    defaultTone: user.defaultTone,
    customToneInstructions: user.customToneInstructions,
    plan: user.plan,
    monthlyGenerations: user.monthlyGenerations,
    generationLimit: user.generationLimit,
    usageResetDate: user.usageResetDate,
    createdAt: user.createdAt,
  });
};

// PUT /api/user/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };
  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;

  const user = await User.findByIdAndUpdate(req.user!._id, updates, {
    new: true,
  }).select("-passwordHash");

  res.json(user);
};

// PUT /api/user/brand-voice
export const updateBrandVoice = async (req: AuthRequest, res: Response) => {
  const { defaultTone, customToneInstructions, brandName } = req.body as {
    defaultTone?: string;
    customToneInstructions?: string;
    brandName?: string;
  };

  const updates: Record<string, string | undefined> = {};
  if (defaultTone) updates.defaultTone = defaultTone;
  if (customToneInstructions !== undefined)
    updates.customToneInstructions = customToneInstructions;
  if (brandName !== undefined) updates.brandName = brandName;

  const user = await User.findByIdAndUpdate(req.user!._id, updates, {
    new: true,
  }).select("-passwordHash");

  res.json(user);
};

// GET /api/user/analytics
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;

  const [generations, totalProducts] = await Promise.all([
    Generation.find({ userId }).lean(),
    (await import("../models/Product.js")).default.countDocuments({ userId }),
  ]);

  const totalGenerations = generations.length;
  const totalTokens = generations.reduce(
    (s, g) => s + (g.totalTokensUsed ?? 0),
    0
  );
  const totalCost = generations.reduce(
    (s, g) => s + (g.costEstimate ?? 0),
    0
  );

  // SEO score distribution
  const seoScores: number[] = [];
  for (const gen of generations) {
    for (const v of gen.variants ?? []) {
      if (v.seoScore != null) seoScores.push(v.seoScore);
    }
  }

  const scoreBuckets = [
    { label: "0-20", count: 0 },
    { label: "21-40", count: 0 },
    { label: "41-60", count: 0 },
    { label: "61-80", count: 0 },
    { label: "81-100", count: 0 },
  ];
  for (const s of seoScores) {
    const idx = Math.min(Math.floor(s / 20), 4);
    scoreBuckets[idx]!.count++;
  }

  // Generations over last 30 days (daily counts)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyCounts: Record<string, number> = {};
  for (const gen of generations) {
    const d = new Date(gen.createdAt);
    if (d >= thirtyDaysAgo) {
      const key = d.toISOString().slice(0, 10);
      dailyCounts[key] = (dailyCounts[key] ?? 0) + 1;
    }
  }

  const generationsByDay = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    generationsByDay.push({ date: key, count: dailyCounts[key] ?? 0 });
  }

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const gen of generations) {
    platformCounts[gen.platform] = (platformCounts[gen.platform] ?? 0) + 1;
  }
  const platformBreakdown = Object.entries(platformCounts).map(
    ([platform, count]) => ({ platform, count })
  );

  res.json({
    totalProducts,
    totalGenerations,
    totalTokens,
    totalCost,
    avgSeoScore:
      seoScores.length > 0
        ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length)
        : 0,
    seoScoreDistribution: scoreBuckets,
    generationsByDay,
    platformBreakdown,
  });
};
