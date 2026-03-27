export interface Plan {
  name: "free" | "starter" | "pro" | "enterprise";
  price: number;
  limit: number;
  features: string[];
}

export interface UsageInfo {
  plan: "free" | "starter" | "pro" | "enterprise";
  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: string;
}

export interface Analytics {
  totalProducts: number;
  totalGenerations: number;
  totalTokens: number;
  totalCost: number;
  avgSeoScore: number;
  seoScoreDistribution: { label: string; count: number }[];
  generationsByDay: { date: string; count: number }[];
  platformBreakdown: { platform: string; count: number }[];
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  image?: string;
  brandName?: string;
  defaultTone: "professional" | "casual" | "luxury" | "playful" | "custom";
  customToneInstructions?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: string;
  createdAt: string;
}
