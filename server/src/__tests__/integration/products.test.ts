import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";
import { createAuthenticatedUser } from "../helpers.js";
import Product from "../../models/Product.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("Products API", () => {
  const productData = {
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    features: ["100% organic cotton", "Breathable"],
    benefits: ["Eco-friendly"],
    price: 29.99,
    brand: "EcoWear",
  };

  describe("POST /api/products", () => {
    it("should create a product", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Organic Cotton T-Shirt");
      expect(res.body.source).toBe("manual");
      expect(res.body.userId).toBeDefined();
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/products")
        .send(productData);

      expect(res.status).toBe(401);
    });

    it("should reject product without name", async () => {
      const { token } = await createAuthenticatedUser();
      const { name: _n, ...noName } = productData;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(noName);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/products", () => {
    it("should list products for authenticated user", async () => {
      const { user, token } = await createAuthenticatedUser();

      await Product.create([
        { ...productData, userId: user._id },
        { ...productData, userId: user._id, name: "Product 2" },
      ]);

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it("should not return other users products", async () => {
      const { token } = await createAuthenticatedUser();
      const otherUserId = new mongoose.Types.ObjectId();

      await Product.create({ ...productData, userId: otherUserId });

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.products).toHaveLength(0);
    });

    it("should paginate results", async () => {
      const { user, token } = await createAuthenticatedUser();

      const products = Array.from({ length: 25 }, (_, i) => ({
        ...productData,
        userId: user._id,
        name: `Product ${i}`,
      }));
      await Product.create(products);

      const res = await request(app)
        .get("/api/products?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.products).toHaveLength(10);
      expect(res.body.pagination.total).toBe(25);
      expect(res.body.pagination.pages).toBe(3);
    });

    it("should filter by source", async () => {
      const { user, token } = await createAuthenticatedUser();

      await Product.create([
        { ...productData, userId: user._id, source: "manual" },
        { ...productData, userId: user._id, name: "CSV Prod", source: "csv" },
      ]);

      const res = await request(app)
        .get("/api/products?source=csv")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].source).toBe("csv");
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a single product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const product = await Product.create({ ...productData, userId: user._id });

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Organic Cotton T-Shirt");
    });

    it("should return 404 for another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const otherUserId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        ...productData,
        userId: otherUserId,
      });

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent product", async () => {
      const { token } = await createAuthenticatedUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const product = await Product.create({ ...productData, userId: user._id });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated T-Shirt", price: 39.99 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated T-Shirt");
      expect(res.body.price).toBe(39.99);
    });

    it("should not update another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const otherUserId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        ...productData,
        userId: otherUserId,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hacked" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const product = await Product.create({ ...productData, userId: user._id });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Product deleted");

      const found = await Product.findById(product._id);
      expect(found).toBeNull();
    });

    it("should not delete another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const otherUserId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        ...productData,
        userId: otherUserId,
      });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);

      const found = await Product.findById(product._id);
      expect(found).not.toBeNull();
    });
  });
});
