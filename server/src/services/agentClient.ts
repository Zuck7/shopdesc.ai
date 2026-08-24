import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const agentApi = axios.create({
  baseURL: env.AGENTS_URL,
  timeout: 120_000, // 2 minutes — generation can take a while
  headers: {
    "Content-Type": "application/json",
    ...(env.AGENT_API_KEY
      ? { "x-agent-api-key": env.AGENT_API_KEY }
      : {}),
  },
});

export interface AgentProductInput {
  name: string;
  category?: string;
  features: string[];
  price?: number;
  currency: string;
  brand?: string;
  images: string[];
  raw_description?: string;
  raw_data?: Record<string, unknown>;
}

export interface AgentKeyword {
  term: string;
  search_volume: number | null;
  difficulty: number | null;
  relevance: number;
  keyword_type: string;
}

export interface AgentProductBrief {
  product_name: string;
  product_type: string;
  category: string;
  subcategory: string | null;
  core_features: string[];
  key_benefits: string[];
  target_audience: string;
  use_cases: string[];
  unique_selling_points: string[];
  price_positioning: string;
  emotional_triggers: string[];
}

export interface AgentSEOStrategy {
  primary_keyword: AgentKeyword;
  secondary_keywords: AgentKeyword[];
  long_tail_keywords: AgentKeyword[];
  target_word_count: number;
  target_keyword_density: number;
  meta_title_max_length: number;
  meta_description_max_length: number;
  platform_specific_notes: string;
  search_intent: string;
}

export interface AgentContentVariant {
  variant_label: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  bullet_points: string[];
  seo_score: number;
  readability_score: number;
  word_count: number;
}

export interface AgentCompetitorListing {
  title: string;
  url: string | null;
  platform: string;
  strengths: string[];
  weaknesses: string[];
}

export interface AgentCompetitorAnalysis {
  top_competitors: AgentCompetitorListing[];
  common_keywords: string[];
  content_gaps: string[];
  differentiation_suggestions: string[];
  average_title_length: number;
  average_description_length: number;
}

export interface AgentGenerationOutput {
  product_brief: AgentProductBrief;
  seo_strategy: AgentSEOStrategy;
  variants: AgentContentVariant[];
  competitor_analysis: AgentCompetitorAnalysis | null;
  total_tokens_used: number;
  processing_time_ms: number;
}

export interface SingleGeneratePayload {
  product: AgentProductInput;
  platform: string;
  tone: string;
  custom_tone_instructions?: string;
  include_competitor_analysis: boolean;
}

export async function callGenerateSingle(
  payload: SingleGeneratePayload
): Promise<AgentGenerationOutput> {
  logger.info(`Calling agent service: POST /generate/single for "${payload.product.name}"`);

  const { data } = await agentApi.post<AgentGenerationOutput>(
    "/generate/single",
    payload
  );

  logger.info(
    `Agent service returned: ${data.variants.length} variants, ${data.total_tokens_used} tokens, ${data.processing_time_ms}ms`
  );

  return data;
}

export async function checkAgentHealth(): Promise<boolean> {
  try {
    const { data } = await agentApi.get("/health", { timeout: 5000 });
    return data.status === "healthy";
  } catch {
    return false;
  }
}
