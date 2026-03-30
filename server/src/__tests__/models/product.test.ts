import mongoose from "mongoose";
import Product from "../../models/Product.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const userId = new mongoose.Types.ObjectId();

describe("Product Model", () => {
  const validProduct = {
    userId,
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    features: ["100% organic cotton", "Breathable"],
    benefits: ["Eco-friendly", "Comfortable"],
    price: 29.99,
    brand: "EcoWear",
  };

  it("should create a product with valid fields", async () => {
    const product = await Product.create(validProduct);
    expect(product.name).toBe("Organic Cotton T-Shirt");
    expect(product.source).toBe("manual");
    expect(product.currency).toBe("USD");
    expect(product.features).toHaveLength(2);
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();
  });

  it("should require userId", async () => {
    const { userId: _u, ...rest } = validProduct;
    await expect(Product.create(rest)).rejects.toThrow();
  });

  it("should require name", async () => {
    const { name: _n, ...rest } = validProduct;
    await expect(Product.create(rest)).rejects.toThrow();
  });

  it("should default source to manual", async () => {
    const product = await Product.create(validProduct);
    expect(product.source).toBe("manual");
  });

  it("should reject invalid source", async () => {
    await expect(
      Product.create({ ...validProduct, source: "invalid" })
    ).rejects.toThrow();
  });

  it("should accept csv and shopify source", async () => {
    const csv = await Product.create({ ...validProduct, source: "csv" });
    expect(csv.source).toBe("csv");

    const shopify = await Product.create({
      ...validProduct,
      source: "shopify",
      externalId: "12345",
    });
    expect(shopify.source).toBe("shopify");
  });

  it("should default currency to USD", async () => {
    const product = await Product.create(validProduct);
    expect(product.currency).toBe("USD");
  });

  it("should trim the name", async () => {
    const product = await Product.create({
      ...validProduct,
      name: "  Padded Name  ",
    });
    expect(product.name).toBe("Padded Name");
  });

  it("should store arrays for features, benefits, images, tags", async () => {
    const product = await Product.create({
      ...validProduct,
      images: ["https://img.com/1.jpg"],
      tags: ["organic", "eco"],
    });
    expect(product.images).toEqual(["https://img.com/1.jpg"]);
    expect(product.tags).toEqual(["organic", "eco"]);
  });

  it("should store rawData as mixed type", async () => {
    const rawData = { custom: "value", nested: { a: 1 } };
    const product = await Product.create({ ...validProduct, rawData });
    expect(product.rawData).toEqual(rawData);
  });
});
