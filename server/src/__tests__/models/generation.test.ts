import crypto from "crypto";
import { db } from "../../config/db.js";
import { users, products, generations } from "../../models/schema.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("Generation table", () => {
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({ email: "gen@test.com", name: "Gen User", passwordHash: "hash" })
      .returning();
    userId = user!.id;
    const [product] = await db
      .insert(products)
      .values({ userId, name: "Gen Product" })
      .returning();
    productId = product!.id;
  });

  const validGeneration = () => ({
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
        status: "generated" as const,
      },
    ],
    totalTokensUsed: 500,
    costEstimate: "0.01",
    processingTimeMs: 3000,
  });

  it("should create a generation with valid fields", async () => {
    const [gen] = await db.insert(generations).values(validGeneration()).returning();
    expect(gen!.platform).toBe("shopify");
    expect(gen!.tone).toBe("professional");
    expect(gen!.variants).toHaveLength(1);
    expect(gen!.variants[0]!.variantLabel).toBe("A");
    expect(gen!.totalTokensUsed).toBe(500);
    expect(gen!.createdAt).toBeDefined();
  });

  it("should default platform to generic", async () => {
    const [gen] = await db
      .insert(generations)
      .values({ userId, productId, variants: [] })
      .returning();
    expect(gen!.platform).toBe("generic");
  });

  it("should default tone to professional", async () => {
    const [gen] = await db
      .insert(generations)
      .values({ userId, productId, variants: [] })
      .returning();
    expect(gen!.tone).toBe("professional");
  });

  it("should store productBrief and seoStrategy as jsonb", async () => {
    const [gen] = await db
      .insert(generations)
      .values({
        ...validGeneration(),
        productBrief: { summary: "test" },
        seoStrategy: { keywords: ["test"] },
      })
      .returning();
    expect(gen!.productBrief).toEqual({ summary: "test" });
    expect(gen!.seoStrategy).toEqual({ keywords: ["test"] });
  });
});
