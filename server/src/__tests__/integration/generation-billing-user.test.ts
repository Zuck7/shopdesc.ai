import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";
import { createAuthenticatedUser } from "../helpers.js";
import Product from "../../models/Product.js";
import Generation from "../../models/Generation.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

function makeVariant(label: string) {
  return {
    variantLabel: label,
    title: `Title ${label}`,
    description: `Description for variant ${label}`,
    keywords: ["test", "product"],
    bulletPoints: ["Point 1"],
    seoScore: 75,
    readabilityScore: 80,
    wordCount: 10,
  };
}

describe("Generations API", () => {
  describe("GET /api/generations/:productId", () => {
    it("should list generations for a product", async () => {
      const { user, token } = await createAuthenticatedUser();
      const product = await Product.create({
        userId: user._id,
        name: "Test Product",
      });

      await Generation.create([
        {
          userId: user._id,
          productId: product._id,
          platform: "shopify",
          variants: [makeVariant("A")],
        },
        {
          userId: user._id,
          productId: product._id,
          platform: "amazon",
          variants: [makeVariant("A"), makeVariant("B")],
        },
      ]);

      const res = await request(app)
        .get(`/api/generations/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should not list generations for another users product", async () => {
      const { token } = await createAuthenticatedUser();
      const otherUserId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        userId: otherUserId,
        name: "Other Product",
      });

      await Generation.create({
        userId: otherUserId,
        productId: product._id,
        variants: [makeVariant("A")],
      });

      const res = await request(app)
        .get(`/api/generations/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /api/generations/detail/:id", () => {
    it("should return a single generation with detail", async () => {
      const { user, token } = await createAuthenticatedUser();
      const product = await Product.create({
        userId: user._id,
        name: "Detail Product",
      });

      const gen = await Generation.create({
        userId: user._id,
        productId: product._id,
        platform: "shopify",
        tone: "professional",
        variants: [makeVariant("A"), makeVariant("B"), makeVariant("C")],
        totalTokensUsed: 1000,
        costEstimate: 0.05,
        processingTimeMs: 5000,
      });

      const res = await request(app)
        .get(`/api/generations/detail/${gen._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.platform).toBe("shopify");
      expect(res.body.variants).toHaveLength(3);
      expect(res.body.totalTokensUsed).toBe(1000);
    });

    it("should return 404 for non-existent generation", async () => {
      const { token } = await createAuthenticatedUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/generations/detail/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});

describe("Billing API", () => {
  describe("GET /api/billing/plans", () => {
    it("should return all plans without auth", async () => {
      const res = await request(app).get("/api/billing/plans");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);
      expect(res.body[0].name).toBe("free");
      expect(res.body[0].price).toBe(0);
      expect(res.body[1].name).toBe("starter");
      expect(res.body[2].name).toBe("pro");
      expect(res.body[3].name).toBe("enterprise");
    });

    it("should include features for each plan", async () => {
      const res = await request(app).get("/api/billing/plans");

      for (const plan of res.body) {
        expect(plan.features).toBeDefined();
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it("should not expose stripePriceId", async () => {
      const res = await request(app).get("/api/billing/plans");

      for (const plan of res.body) {
        expect(plan.stripePriceId).toBeUndefined();
      }
    });
  });

  describe("GET /api/billing/usage", () => {
    it("should return usage for authenticated user", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .get("/api/billing/usage")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.plan).toBe("free");
      expect(res.body.monthlyGenerations).toBe(0);
      expect(res.body.generationLimit).toBe(5);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/billing/usage");
      expect(res.status).toBe(401);
    });
  });
});

describe("User API", () => {
  describe("GET /api/users/profile", () => {
    it("should return user profile", async () => {
      const { token } = await createAuthenticatedUser({
        email: "profile@example.com",
        name: "Profile User",
      });

      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("profile@example.com");
      expect(res.body.name).toBe("Profile User");
      expect(res.body.defaultTone).toBe("professional");
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update name", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New Name");
    });

    it("should update brandName", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ brandName: "My Brand" });

      expect(res.status).toBe(200);
      expect(res.body.brandName).toBe("My Brand");
    });
  });

  describe("PUT /api/users/brand-voice", () => {
    it("should update brand voice settings", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .put("/api/users/brand-voice")
        .set("Authorization", `Bearer ${token}`)
        .send({
          defaultTone: "luxury",
          customToneInstructions: "Use elegant language",
        });

      expect(res.status).toBe(200);
      expect(res.body.defaultTone).toBe("luxury");
      expect(res.body.customToneInstructions).toBe("Use elegant language");
    });
  });

  describe("GET /api/users/analytics", () => {
    it("should return analytics data", async () => {
      const { user, token } = await createAuthenticatedUser();

      await Product.create({ userId: user._id, name: "Analytics Product" });
      await Generation.create({
        userId: user._id,
        productId: new mongoose.Types.ObjectId(),
        platform: "shopify",
        variants: [makeVariant("A")],
        costEstimate: 0.05,
      });

      const res = await request(app)
        .get("/api/users/analytics")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalProducts).toBe(1);
      expect(res.body.totalGenerations).toBe(1);
      expect(typeof res.body.avgSeoScore).toBe("number");
      expect(res.body.generationsByDay).toBeDefined();
      expect(res.body.seoScoreDistribution).toBeDefined();
      expect(res.body.platformBreakdown).toBeDefined();
    });

    it("should return zeroes for fresh user", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .get("/api/users/analytics")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalProducts).toBe(0);
      expect(res.body.totalGenerations).toBe(0);
      expect(res.body.avgSeoScore).toBe(0);
      expect(res.body.totalCost).toBe(0);
    });
  });
});
