export interface IVariant {
  _id: string;
  variantLabel: string;
  title: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  bulletPoints: string[];
  seoScore?: number;
  readabilityScore?: number;
  wordCount: number;
  status: "generated" | "approved" | "rejected" | "edited";
}

export interface IGeneration {
  _id: string;
  userId: string;
  productId: string | { _id: string; name: string; category?: string; brand?: string };
  jobId?: string;
  platform: "shopify" | "amazon" | "etsy" | "woocommerce" | "generic";
  tone: "professional" | "casual" | "luxury" | "playful" | "custom";
  productBrief?: Record<string, unknown>;
  seoStrategy?: Record<string, unknown>;
  competitorAnalysis?: Record<string, unknown>;
  variants: IVariant[];
  totalTokensUsed: number;
  costEstimate: number;
  processingTimeMs: number;
  createdAt: string;
}

export interface GenerateSinglePayload {
  platform: string;
  tone: string;
  custom_tone_instructions?: string;
  include_competitor_analysis: boolean;
}
