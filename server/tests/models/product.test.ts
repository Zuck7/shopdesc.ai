import { setupTestDB, teardownTestDB, clearCollections } from "../setup.js";
import mongoose from "mongoose";
import Product from "../../src/models/Product.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearCollections();
});

describe("Product model", () => {
  const userId = new mongoose.Types.ObjectId();

  const validProduct = {
    userId,
    name: "Test Widget",
    category: "Electronics",
    features: ["Lightweight", "Durable"],
    price: 29.99,
  };

  it("should create a product with valid data", async () => {
    const product = await Product.create(validProduct);
    expect(product.name).toBe("Test Widget");
    expect(product.source).toBe("manual");
    expect(product.currency).toBe("USD");
    expect(product.features).toHaveLength(2);
  });

  it("should require userId", async () => {
    await expect(
      Product.create({ name: "No User" })
    ).rejects.toThrow();
  });

  it("should require name", async () => {
    await expect(
      Product.create({ userId })
    ).rejects.toThrow();
  });

  it("should only allow valid source values", async () => {
    const p = await Product.create({ ...validProduct, source: "csv" });
    expect(p.source).toBe("csv");

    await expect(
      Product.create({
        ...validProduct,
        source: "magento" as never,
      })
    ).rejects.toThrow();
  });

  it("should default arrays to empty", async () => {
    const p = await Product.create({ userId, name: "Minimal" });
    expect(p.features).toEqual([]);
    expect(p.benefits).toEqual([]);
    expect(p.images).toEqual([]);
    expect(p.tags).toEqual([]);
  });

  it("should store rawData as mixed type", async () => {
    const raw = { sku: "ABC123", weight: 1.5 };
    const p = await Product.create({ ...validProduct, rawData: raw });
    expect(p.rawData).toMatchObject(raw);
  });

  it("should set timestamps", async () => {
    const p = await Product.create(validProduct);
    expect(p.createdAt).toBeInstanceOf(Date);
    expect(p.updatedAt).toBeInstanceOf(Date);
  });
});
