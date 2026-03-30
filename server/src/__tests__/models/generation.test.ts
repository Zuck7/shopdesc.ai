import mongoose from "mongoose";
import Generation from "../../models/Generation.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const userId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();

describe("Generation Model", () => {
  const validGeneration = {
    userId,
    productId,
    platform: "shopify" as const,
    tone: "professional" as const,
    variants: [
      {
        variantLabel: "A",
        title: "Premium Organic Cotton T-Shirt",
        description: "A premium t-shirt made from 100% organic cotton.",
        keywords: ["organic", "cotton"],
        bulletPoints: ["Eco-friendly", "Breathable"],
        wordCount: 15,
      },
    ],
    totalTokensUsed: 500,
    costEstimate: 0.01,
    processingTimeMs: 3000,
  };

  it("should create a generation with valid fields", async () => {
    const gen = await Generation.create(validGeneration);
    expect(gen.platform).toBe("shopify");
    expect(gen.tone).toBe("professional");
    expect(gen.variants).toHaveLength(1);
    expect(gen.variants[0]!.variantLabel).toBe("A");
    expect(gen.totalTokensUsed).toBe(500);
    expect(gen.createdAt).toBeDefined();
  });

  it("should require userId", async () => {
    const { userId: _u, ...rest } = validGeneration;
    await expect(Generation.create(rest)).rejects.toThrow();
  });

  it("should require productId", async () => {
    const { productId: _p, ...rest } = validGeneration;
    await expect(Generation.create(rest)).rejects.toThrow();
  });

  it("should default platform to generic", async () => {
    const gen = await Generation.create({
      userId,
      productId,
      variants: [],
    });
    expect(gen.platform).toBe("generic");
  });

  it("should default tone to professional", async () => {
    const gen = await Generation.create({
      userId,
      productId,
      variants: [],
    });
    expect(gen.tone).toBe("professional");
  });

  it("should reject invalid platform", async () => {
    await expect(
      Generation.create({ ...validGeneration, platform: "invalid" })
    ).rejects.toThrow();
  });

  it("should reject invalid tone", async () => {
    await expect(
      Generation.create({ ...validGeneration, tone: "angry" })
    ).rejects.toThrow();
  });

  it("should validate variant seoScore range (0-100)", async () => {
    await expect(
      Generation.create({
        ...validGeneration,
        variants: [
          { ...validGeneration.variants[0]!, seoScore: 150 },
        ],
      })
    ).rejects.toThrow();
  });

  it("should default variant status to generated", async () => {
    const gen = await Generation.create(validGeneration);
    expect(gen.variants[0]!.status).toBe("generated");
  });

  it("should require variant title and description", async () => {
    await expect(
      Generation.create({
        ...validGeneration,
        variants: [{ variantLabel: "A", wordCount: 0 }],
      })
    ).rejects.toThrow();
  });

  it("should store optional jobId", async () => {
    const jobId = new mongoose.Types.ObjectId();
    const gen = await Generation.create({ ...validGeneration, jobId });
    expect(gen.jobId!.toString()).toBe(jobId.toString());
  });

  it("should store productBrief and seoStrategy as mixed", async () => {
    const gen = await Generation.create({
      ...validGeneration,
      productBrief: { summary: "test" },
      seoStrategy: { keywords: ["test"] },
    });
    expect(gen.productBrief).toEqual({ summary: "test" });
    expect(gen.seoStrategy).toEqual({ keywords: ["test"] });
  });
});
