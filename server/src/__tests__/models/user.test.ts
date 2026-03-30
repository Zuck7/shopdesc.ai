import mongoose from "mongoose";
import User from "../../models/User.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("User Model", () => {
  const validUser = {
    email: "test@example.com",
    passwordHash: "$2a$12$hashedpassword",
    name: "Test User",
  };

  it("should create a user with valid fields", async () => {
    const user = await User.create(validUser);
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    expect(user.plan).toBe("free");
    expect(user.defaultTone).toBe("professional");
    expect(user.monthlyGenerations).toBe(0);
    expect(user.generationLimit).toBe(5);
    expect(user.createdAt).toBeDefined();
  });

  it("should require email", async () => {
    await expect(
      User.create({ passwordHash: "hash", name: "No Email" })
    ).rejects.toThrow();
  });

  it("should require name", async () => {
    await expect(
      User.create({ email: "a@b.com", passwordHash: "hash" })
    ).rejects.toThrow();
  });

  it("should enforce unique email", async () => {
    await User.create(validUser);
    await expect(User.create(validUser)).rejects.toThrow();
  });

  it("should lowercase and trim email", async () => {
    const user = await User.create({
      ...validUser,
      email: "  TEST@Example.COM  ",
    });
    expect(user.email).toBe("test@example.com");
  });

  it("should default plan to free", async () => {
    const user = await User.create(validUser);
    expect(user.plan).toBe("free");
  });

  it("should reject invalid plan value", async () => {
    await expect(
      User.create({ ...validUser, plan: "invalid" })
    ).rejects.toThrow();
  });

  it("should reject invalid tone value", async () => {
    await expect(
      User.create({ ...validUser, defaultTone: "angry" })
    ).rejects.toThrow();
  });

  it("should accept valid tone values", async () => {
    for (const tone of [
      "professional",
      "casual",
      "luxury",
      "playful",
      "custom",
    ]) {
      const user = await User.create({
        ...validUser,
        email: `${tone}@test.com`,
        defaultTone: tone,
      });
      expect(user.defaultTone).toBe(tone);
    }
  });

  it("should set usageResetDate by default", async () => {
    const user = await User.create(validUser);
    expect(user.usageResetDate).toBeInstanceOf(Date);
  });
});
