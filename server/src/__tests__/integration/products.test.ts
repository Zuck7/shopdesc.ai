import request from "supertest";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { app } from "../../app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";
import { createAuthenticatedUser } from "../helpers.js";
import { db } from "../../config/db.js";
import { products } from "../../models/schema.js";

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

      await db.insert(products).values([
        { ...productData, price: String(productData.price), userId: user.id },
        { ...productData, price: String(productData.price), userId: user.id, name: "Product 2" },
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
      const { user: otherUser } = await createAuthenticatedUser({ email: "other@test.com" });

      await db.insert(products).values({
        ...productData,
        price: String(productData.price),
        userId: otherUser.id,
      });

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.products).toHaveLength(0);
    });

    it("should paginate results", async () => {
      const { user, token } = await createAuthenticatedUser();

      const docs = Array.from({ length: 25 }, (_, i) => ({
        ...productData,
        price: String(productData.price),
        userId: user.id,
        name: `Product ${i}`,
      }));
      await db.insert(products).values(docs);

      const res = await request(app)
        .get("/api/products?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.products).toHaveLength(10);
      expect(res.body.pagination.total).toBe(25);
      expect(res.body.pagination.pages).toBe(3);
    });

    it("should filter by source", async () => {
      const { user, token } = await createAuthenticatedUser();

      await db.insert(products).values([
        { ...productData, price: String(productData.price), userId: user.id, source: "manual" },
        { ...productData, price: String(productData.price), userId: user.id, name: "CSV Prod", source: "csv" },
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
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: user.id })
        .returning();

      const res = await request(app)
        .get(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Organic Cotton T-Shirt");
    });

    it("should return 404 for another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const { user: otherUser } = await createAuthenticatedUser({ email: "other2@test.com" });
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: otherUser.id })
        .returning();

      const res = await request(app)
        .get(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent product", async () => {
      const { token } = await createAuthenticatedUser();
      const fakeId = crypto.randomUUID();

      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: user.id })
        .returning();

      const res = await request(app)
        .put(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated T-Shirt", price: 39.99 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated T-Shirt");
    });

    it("should not update another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const { user: otherUser } = await createAuthenticatedUser({ email: "other3@test.com" });
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: otherUser.id })
        .returning();

      const res = await request(app)
        .put(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hacked" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: user.id })
        .returning();

      const res = await request(app)
        .delete(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Product deleted");

      const [found] = await db.select().from(products).where(eq(products.id, product!.id)).limit(1);
      expect(found).toBeUndefined();
    });

    it("should not delete another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const { user: otherUser } = await createAuthenticatedUser({ email: "other4@test.com" });
      const [product] = await db
        .insert(products)
        .values({ ...productData, price: String(productData.price), userId: otherUser.id })
        .returning();

      const res = await request(app)
        .delete(`/api/products/${product!.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);

      const [found] = await db.select().from(products).where(eq(products.id, product!.id)).limit(1);
      expect(found).toBeDefined();
    });
  });
});
