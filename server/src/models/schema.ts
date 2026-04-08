import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums as pgEnum ────────────────────────────────────────────────────────

const toneEnum = ["professional", "casual", "luxury", "playful", "custom"] as const;
const planEnum = ["free", "starter", "pro", "enterprise"] as const;
const platformEnum = ["shopify", "amazon", "etsy", "woocommerce", "generic"] as const;
const sourceEnum = ["manual", "csv", "shopify"] as const;
const variantStatusEnum = ["generated", "approved", "rejected", "edited"] as const;
const bulkJobStatusEnum = ["queued", "processing", "completed", "failed", "cancelled"] as const;

export type Tone = (typeof toneEnum)[number];
export type Plan = (typeof planEnum)[number];
export type Platform = (typeof platformEnum)[number];
export type Source = (typeof sourceEnum)[number];
export type VariantStatus = (typeof variantStatusEnum)[number];
export type BulkJobStatus = (typeof bulkJobStatusEnum)[number];

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    name: varchar("name", { length: 255 }).notNull(),
    image: text("image"),
    googleId: varchar("google_id", { length: 255 }),

    brandName: varchar("brand_name", { length: 255 }),
    defaultTone: varchar("default_tone", { length: 20 }).notNull().default("professional").$type<Tone>(),
    customToneInstructions: text("custom_tone_instructions"),

    plan: varchar("plan", { length: 20 }).notNull().default("free").$type<Plan>(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),

    monthlyGenerations: integer("monthly_generations").notNull().default(0),
    generationLimit: integer("generation_limit").notNull().default(5),
    usageResetDate: timestamp("usage_reset_date", { withTimezone: true }).notNull().defaultNow(),

    shopifyDomain: varchar("shopify_domain", { length: 255 }),
    shopifyAccessToken: text("shopify_access_token"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("users_google_id_idx").on(table.googleId),
  ]
);

// ─── Products ──────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 20 }).notNull().default("manual").$type<Source>(),
    externalId: varchar("external_id", { length: 255 }),

    name: varchar("name", { length: 500 }).notNull(),
    category: varchar("category", { length: 255 }),
    subcategory: varchar("subcategory", { length: 255 }),
    features: jsonb("features").notNull().default([]).$type<string[]>(),
    benefits: jsonb("benefits").notNull().default([]).$type<string[]>(),
    price: numeric("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    images: jsonb("images").notNull().default([]).$type<string[]>(),
    brand: varchar("brand", { length: 255 }),
    targetAudience: text("target_audience"),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    tags: jsonb("tags").notNull().default([]).$type<string[]>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("products_user_id_idx").on(table.userId),
    index("products_user_source_idx").on(table.userId, table.source),
    index("products_name_idx").on(table.name),
  ]
);

// ─── Generations ───────────────────────────────────────────────────────────

export interface IVariant {
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
  status: VariantStatus;
  editedContent?: Record<string, unknown>;
}

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => bulkJobs.id, { onDelete: "set null" }),

    platform: varchar("platform", { length: 20 }).notNull().default("generic").$type<Platform>(),
    tone: varchar("tone", { length: 20 }).notNull().default("professional").$type<Tone>(),

    productBrief: jsonb("product_brief").$type<Record<string, unknown>>(),
    seoStrategy: jsonb("seo_strategy").$type<Record<string, unknown>>(),
    competitorAnalysis: jsonb("competitor_analysis").$type<Record<string, unknown>>(),

    variants: jsonb("variants").notNull().default([]).$type<IVariant[]>(),

    totalTokensUsed: integer("total_tokens_used").notNull().default(0),
    costEstimate: numeric("cost_estimate", { precision: 10, scale: 6 }).notNull().default("0"),
    processingTimeMs: integer("processing_time_ms").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("generations_user_id_idx").on(table.userId),
    index("generations_product_id_idx").on(table.productId),
    index("generations_job_id_idx").on(table.jobId),
    index("generations_product_created_idx").on(table.productId, table.createdAt),
  ]
);

// ─── Bulk Jobs ─────────────────────────────────────────────────────────────

export const bulkJobs = pgTable(
  "bulk_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    status: varchar("status", { length: 20 }).notNull().default("queued").$type<BulkJobStatus>(),
    platform: varchar("platform", { length: 20 }).notNull().default("generic").$type<Platform>(),
    tone: varchar("tone", { length: 20 }).notNull().default("professional").$type<Tone>(),
    includeCompetitor: boolean("include_competitor").notNull().default(false),

    productIds: jsonb("product_ids").notNull().default([]).$type<string[]>(),
    totalProducts: integer("total_products").notNull().default(0),
    completedProducts: integer("completed_products").notNull().default(0),
    failedProducts: integer("failed_products").notNull().default(0),

    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bulk_jobs_user_id_idx").on(table.userId),
    index("bulk_jobs_user_status_idx").on(table.userId, table.status),
  ]
);
