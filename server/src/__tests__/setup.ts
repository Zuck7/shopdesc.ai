import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "../models/schema.js";

let client: PGlite;
let testDb: ReturnType<typeof drizzle>;

export async function connectTestDB() {
  client = new PGlite();
  testDb = drizzle(client, { schema });

  // Create tables using raw SQL matching the Drizzle schema
  await client.exec(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      name TEXT,
      password_hash TEXT,
      google_id TEXT,
      image TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      brand_name TEXT,
      default_tone TEXT NOT NULL DEFAULT 'professional',
      custom_tone_instructions TEXT,
      monthly_generations INTEGER NOT NULL DEFAULT 0,
      generation_limit INTEGER NOT NULL DEFAULT 5,
      usage_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      shopify_domain TEXT,
      shopify_access_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source TEXT NOT NULL DEFAULT 'manual',
      shopify_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      brand TEXT,
      features JSONB DEFAULT '[]',
      benefits JSONB DEFAULT '[]',
      price NUMERIC(10,2),
      currency TEXT DEFAULT 'USD',
      images JSONB DEFAULT '[]',
      tags JSONB DEFAULT '[]',
      raw_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS generations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      job_id UUID,
      platform TEXT NOT NULL DEFAULT 'generic',
      tone TEXT NOT NULL DEFAULT 'professional',
      product_brief JSONB,
      seo_strategy JSONB,
      competitor_analysis JSONB,
      variants JSONB DEFAULT '[]',
      total_tokens_used INTEGER DEFAULT 0,
      cost_estimate NUMERIC(10,6) DEFAULT 0,
      processing_time_ms INTEGER,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS bulk_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_ids JSONB NOT NULL DEFAULT '[]',
      platform TEXT NOT NULL DEFAULT 'generic',
      tone TEXT NOT NULL DEFAULT 'professional',
      status TEXT NOT NULL DEFAULT 'pending',
      total_products INTEGER NOT NULL DEFAULT 0,
      completed_products INTEGER NOT NULL DEFAULT 0,
      failed_products INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  `);

  // Replace the app-level db with our test db
  const dbModule = await import("../config/db.js");
  (dbModule as any).db = testDb;
}

export async function disconnectTestDB() {
  await client.close();
}

export async function clearTestDB() {
  await testDb.execute(sql`DELETE FROM generations`);
  await testDb.execute(sql`DELETE FROM products`);
  await testDb.execute(sql`DELETE FROM bulk_jobs`);
  await testDb.execute(sql`DELETE FROM users`);
}
