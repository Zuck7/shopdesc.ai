import request from "supertest";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup.js";
import { app } from "../../src/app.js";
import User from "../../src/models/User.js";
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
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 1);
  futureDate.setDate(1);

  const user = await User.create({
    name: "Tester",
    email: "tester@test.com",
    passwordHash: await bcrypt.hash("pass", 12),
    plan: "pro",
    monthlyGenerations: 42,
    generationLimit: 1000,
    usageResetDate: futureDate,
    brandName: "TestBrand",
    defaultTone: "casual",
    customToneInstructions: "Keep it short",
  });
  userId = user._id.toString();
  token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: "15m" });
});

describe("User API", () => {
  describe("GET /api/user/profile", () => {
    it("should return user profile", async () => {
      const res = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("tester@test.com");
      expect(res.body.name).toBe("Tester");
      expect(res.body.plan).toBe("pro");
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/user/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/user/profile", () => {
    it("should update name", async () => {
      const res = await request(app)
        .put("/api/user/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);

      const user = await User.findById(userId);
      expect(user!.name).toBe("Updated Name");
    });
  });

  describe("PUT /api/user/brand-voice", () => {
    it("should update brand voice settings", async () => {
      const res = await request(app)
        .put("/api/user/brand-voice")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultTone: "luxury",
          customToneInstructions: "Be elegant",
          brandName: "LuxBrand",
        });

      expect(res.status).toBe(200);

      const user = await User.findById(userId);
      expect(user!.defaultTone).toBe("luxury");
      expect(user!.customToneInstructions).toBe("Be elegant");
      expect(user!.brandName).toBe("LuxBrand");
    });
  });

  describe("GET /api/user/analytics", () => {
    it("should return analytics data", async () => {
      const res = await request(app)
        .get("/api/user/analytics")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalProducts");
      expect(res.body).toHaveProperty("totalGenerations");
      expect(res.body).toHaveProperty("avgSeoScore");
      expect(res.body).toHaveProperty("seoScoreDistribution");
      expect(res.body).toHaveProperty("generationsByDay");
      expect(res.body).toHaveProperty("platformBreakdown");
    });
  });
});

describe("Billing API", () => {
  describe("GET /api/billing/plans", () => {
    it("should return available plans", async () => {
      const res = await request(app).get("/api/billing/plans");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(4);

      const planNames = res.body.map((p: { name: string }) => p.name);
      expect(planNames).toContain("free");
      expect(planNames).toContain("starter");
      expect(planNames).toContain("pro");
      expect(planNames).toContain("enterprise");
    });

    it("should have correct free plan details", async () => {
      const res = await request(app).get("/api/billing/plans");
      const free = res.body.find((p: { name: string }) => p.name === "free");

      expect(free.price).toBe(0);
      expect(free.limit).toBe(5);
      expect(free.features).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/billing/usage", () => {
    it("should return usage data", async () => {
      const res = await request(app)
        .get("/api/billing/usage")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.plan).toBe("pro");
      expect(res.body.monthlyGenerations).toBe(42);
      expect(res.body.generationLimit).toBe(1000);
      expect(res.body.usageResetDate).toBeDefined();
    });

    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/billing/usage");
      expect(res.status).toBe(401);
    });
  });
});

describe("Health check", () => {
  it("GET /api/health should return ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
