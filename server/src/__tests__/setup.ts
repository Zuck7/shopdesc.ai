import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as schema from "../models/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

let client: PGlite;
let testDb: ReturnType<typeof drizzle>;

export async function connectTestDB() {
  client = new PGlite();
  testDb = drizzle(client, { schema });

  // Apply the real Drizzle migrations so the test schema can never drift from
  // the production one.
  await migrate(testDb, { migrationsFolder });

  // Replace the app-level db with our test db
  const { setDb } = await import("../config/db.js");
  setDb(testDb);
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
