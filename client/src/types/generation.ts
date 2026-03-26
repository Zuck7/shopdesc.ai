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

export interface IBulkJob {
  _id: string;
  userId: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  platform: "shopify" | "amazon" | "etsy" | "woocommerce" | "generic";
  tone: "professional" | "casual" | "luxury" | "playful" | "custom";
  includeCompetitor: boolean;
  productIds: string[];
  totalProducts: number;
  completedProducts: number;
  failedProducts: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface BulkGeneratePayload {
  productIds: string[];
  platform: string;
  tone: string;
  custom_tone_instructions?: string;
  include_competitor_analysis: boolean;
}

export interface ExportPayload {
  generationIds: string[];
  format: "csv" | "json";
}
