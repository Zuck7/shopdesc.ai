import Stripe from "stripe";
import { env } from "./env.js";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

export const PLAN_CONFIG = {
  free: { limit: 5, priceId: null },
  starter: { limit: 100, priceId: env.STRIPE_STARTER_PRICE_ID ?? null },
  pro: { limit: 1000, priceId: env.STRIPE_PRO_PRICE_ID ?? null },
  enterprise: { limit: Infinity, priceId: env.STRIPE_ENTERPRISE_PRICE_ID ?? null },
} as const;

export type PlanName = keyof typeof PLAN_CONFIG;
