import request from "supertest";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup.js";
import { app } from "../../src/app.js";
import User from "../../src/models/User.js";
import Product from "../../src/models/Product.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";

let token: string;
let userId: string;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const user = await User.create({
    name: "Tester",
    email: "tester@test.com",
    passwordHash: await bcrypt.hash("pass", 12),
  });
  userId = user._id.toString();
  token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: "15m" });
});

describe("Products API", () => {
  describe("POST /api/products", () => {
    it("should create a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Widget",
          category: "Electronics",
          features: ["Fast", "Reliable"],
          price: 19.99,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("New Widget");
      expect(res.body.userId).toBe(userId);
      expect(res.body.source).toBe("manual");
    });

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({ name: "Widget" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/products", () => {
    beforeEach(async () => {
      await Product.create([
        { userId, name: "Widget A", category: "Electronics" },
        { userId, name: "Widget B", category: "Electronics" },
        { userId, name: "Gadget C", category: "Gadgets" },
      ]);
    });

    it("should list paginated products", async () => {
      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it("should paginate results", async () => {
      const res = await request(app)
        .get("/api/products?page=1&limit=2")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.pagination.pages).toBe(2);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should get a product by id", async () => {
      const product = await Product.create({ userId, name: "Single Widget" });

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Single Widget");
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = "aaaaaaaaaaaaaaaaaaaaaaaa";
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const product = await Product.create({ userId, name: "Old Name" });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name", price: 49.99 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New Name");
      expect(res.body.price).toBe(49.99);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const product = await Product.create({ userId, name: "Delete Me" });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const found = await Product.findById(product._id);
      expect(found).toBeNull();
    });
  });
});
