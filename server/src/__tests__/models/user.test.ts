import { db } from "../../config/db.js";
import { users } from "../../models/schema.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("User table", () => {
  const validUser = {
    email: "test@example.com",
    passwordHash: "$2a$12$hashedpassword",
    name: "Test User",
  };

  it("should create a user with valid fields", async () => {
    const [user] = await db.insert(users).values(validUser).returning();
    expect(user!.email).toBe("test@example.com");
    expect(user!.name).toBe("Test User");
    expect(user!.plan).toBe("free");
    expect(user!.defaultTone).toBe("professional");
    expect(user!.monthlyGenerations).toBe(0);
    expect(user!.generationLimit).toBe(5);
    expect(user!.createdAt).toBeDefined();
  });

  it("should enforce unique email", async () => {
    await db.insert(users).values(validUser);
    await expect(db.insert(users).values(validUser)).rejects.toThrow();
  });

  it("should default plan to free", async () => {
    const [user] = await db.insert(users).values(validUser).returning();
    expect(user!.plan).toBe("free");
  });

  it("should set usageResetDate by default", async () => {
    const [user] = await db.insert(users).values(validUser).returning();
    expect(user!.usageResetDate).toBeInstanceOf(Date);
  });

  it("should accept valid tone values", async () => {
    for (const tone of [
      "professional",
      "casual",
      "luxury",
      "playful",
      "custom",
    ] as const) {
      const [user] = await db
        .insert(users)
        .values({
          ...validUser,
          email: `${tone}@test.com`,
          defaultTone: tone,
        })
        .returning();
      expect(user!.defaultTone).toBe(tone);
    }
  });
});
