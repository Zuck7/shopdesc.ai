import { setupTestDB, teardownTestDB, clearCollections } from "../setup.js";
import User from "../../src/models/User.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearCollections();
});

describe("User model", () => {
  const validUser = {
    email: "test@example.com",
    name: "Test User",
    passwordHash: "$2a$12$hashedpassword",
  };

  it("should create a user with valid data", async () => {
    const user = await User.create(validUser);
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    expect(user.plan).toBe("free");
    expect(user.monthlyGenerations).toBe(0);
    expect(user.generationLimit).toBe(5);
    expect(user.defaultTone).toBe("professional");
  });

  it("should lowercase and trim email", async () => {
    const user = await User.create({
      ...validUser,
      email: "  TEST@Example.COM  ",
    });
    expect(user.email).toBe("test@example.com");
  });

  it("should require email", async () => {
    await expect(
      User.create({ name: "No Email", passwordHash: "hash" })
    ).rejects.toThrow();
  });

  it("should require name", async () => {
    await expect(
      User.create({ email: "test@test.com", passwordHash: "hash" })
    ).rejects.toThrow();
  });

  it("should enforce unique email", async () => {
    await User.create(validUser);
    await expect(User.create(validUser)).rejects.toThrow();
  });

  it("should only allow valid plan values", async () => {
    const user = await User.create({ ...validUser, plan: "pro" });
    expect(user.plan).toBe("pro");

    await expect(
      User.create({
        ...validUser,
        email: "other@test.com",
        plan: "invalid" as never,
      })
    ).rejects.toThrow();
  });

  it("should only allow valid tone values", async () => {
    const user = await User.create({
      ...validUser,
      defaultTone: "luxury",
    });
    expect(user.defaultTone).toBe("luxury");

    await expect(
      User.create({
        ...validUser,
        email: "other2@test.com",
        defaultTone: "invalid" as never,
      })
    ).rejects.toThrow();
  });

  it("should set default usageResetDate", async () => {
    const user = await User.create(validUser);
    expect(user.usageResetDate).toBeInstanceOf(Date);
  });

  it("should set timestamps", async () => {
    const user = await User.create(validUser);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
