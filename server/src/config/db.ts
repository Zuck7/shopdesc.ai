import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
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

type Db = NodePgDatabase<typeof schema>;

let dbInstance: Db | undefined;

function resolveDb(): Db {
  if (!dbInstance) {
    dbInstance = drizzle({ client: getPool(), schema });
  }
  return dbInstance;
}

/**
 * Swap the database instance. The test suite uses this to inject an in-memory
 * PGlite database — an ES module's exported binding cannot be reassigned from
 * the outside, so the swap has to go through a function.
 */
export function setDb(next: unknown): void {
  dbInstance = next as Db;
}

// Lazy proxy: the connection pool is only created on first actual use, which
// lets tests substitute their own database before anything touches Postgres.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = resolveDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

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
