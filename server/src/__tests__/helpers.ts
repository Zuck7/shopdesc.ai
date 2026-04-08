import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { users } from "../models/schema.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const passwordHash = await bcrypt.hash("password123", 4);
  const [user] = await db
    .insert(users)
    .values({
      email: `test-${Date.now()}@example.com`,
      passwordHash,
      name: "Test User",
      ...overrides,
    } as typeof users.$inferInsert)
    .returning();
  return user!;
}

export function generateTestToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

export async function createAuthenticatedUser(
  overrides: Record<string, unknown> = {}
) {
  const user = await createTestUser(overrides);
  const token = generateTestToken(user.id);
  return { user, token };
}
