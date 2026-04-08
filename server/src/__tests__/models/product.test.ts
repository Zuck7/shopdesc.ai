import { db } from "../../config/db.js";
import { users, products } from "../../models/schema.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("Product table", () => {
  let userId: string;

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({ email: "prod@test.com", name: "Prod User", passwordHash: "hash" })
      .returning();
    userId = user!.id;
  });

  const base = () => ({
    userId,
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    features: ["100% organic cotton", "Breathable"],
    benefits: ["Eco-friendly", "Comfortable"],
    price: "29.99",
    brand: "EcoWear",
  });

  it("should create a product with valid fields", async () => {
    const [product] = await db.insert(products).values(base()).returning();
    expect(product!.name).toBe("Organic Cotton T-Shirt");
    expect(product!.source).toBe("manual");
    expect(product!.currency).toBe("USD");
    expect(product!.features).toHaveLength(2);
    expect(product!.createdAt).toBeDefined();
    expect(product!.updatedAt).toBeDefined();
  });

  it("should default source to manual", async () => {
    const [product] = await db.insert(products).values(base()).returning();
    expect(product!.source).toBe("manual");
  });

  it("should accept csv and shopify source", async () => {
    const [csv] = await db.insert(products).values({ ...base(), source: "csv" }).returning();
    expect(csv!.source).toBe("csv");

    const [shopify] = await db
      .insert(products)
      .values({ ...base(), source: "shopify", externalId: "12345" })
      .returning();
    expect(shopify!.source).toBe("shopify");
  });

  it("should default currency to USD", async () => {
    const [product] = await db.insert(products).values(base()).returning();
    expect(product!.currency).toBe("USD");
  });

  it("should store arrays for features, benefits, images, tags", async () => {
    const [product] = await db
      .insert(products)
      .values({
        ...base(),
        images: ["https://img.com/1.jpg"],
        tags: ["organic", "eco"],
      })
      .returning();
    expect(product!.images).toEqual(["https://img.com/1.jpg"]);
    expect(product!.tags).toEqual(["organic", "eco"]);
  });

  it("should store rawData as jsonb", async () => {
    const rawData = { custom: "value", nested: { a: 1 } };
    const [product] = await db
      .insert(products)
      .values({ ...base(), rawData })
      .returning();
    expect(product!.rawData).toEqual(rawData);
  });
});
