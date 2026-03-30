import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const passwordHash = await bcrypt.hash("password123", 4);
  const user = await User.create({
    email: `test-${Date.now()}@example.com`,
    passwordHash,
    name: "Test User",
    ...overrides,
  });
  return user;
}

export function generateTestToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

export async function createAuthenticatedUser(
  overrides: Record<string, unknown> = {}
) {
  const user = await createTestUser(overrides);
  const token = generateTestToken(user._id.toString());
  return { user, token };
}
