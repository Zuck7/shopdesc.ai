import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import * as schema from "../models/schema.js";

const { Pool } = pg;

let pool: pg.Pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export const db = drizzle({ client: getPool(), schema });

export const connectDB = async (): Promise<void> => {
  try {
    const p = getPool();
    const client = await p.connect();
    client.release();
    logger.info("PostgreSQL connected successfully");
  } catch (error) {
    logger.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};
