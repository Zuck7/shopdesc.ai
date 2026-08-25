import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../config/db.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The compiled script lives in dist/scripts, so the SQL folder is two levels up.
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder });
  logger.info("Database migrations applied");
}

// Allow running standalone: `npm run db:migrate`
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      logger.error("Migration failed:", err);
      process.exit(1);
    });
}
