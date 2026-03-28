import request from "supertest";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup.js";
import { app } from "../../src/app.js";
import User from "../../src/models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearCollections();
});

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Alice", email: "alice@test.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("alice@test.com");
      expect(res.body.user.name).toBe("Alice");
      expect(res.body.accessToken).toBeDefined();
    });

    it("should return 409 for duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ name: "Alice", email: "alice@test.com", password: "password123" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Alice2", email: "alice@test.com", password: "password456" });

      expect(res.status).toBe(409);
    });

    it("should set refresh token cookie", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Alice", email: "alice@test.com", password: "password123" });

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : String(cookies);
      expect(cookieStr).toContain("refreshToken");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const passwordHash = await bcrypt.hash("password123", 12);
      await User.create({
        name: "Bob",
        email: "bob@test.com",
        passwordHash,
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "bob@test.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("bob@test.com");
      expect(res.body.accessToken).toBeDefined();
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "bob@test.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
    });

    it("should return 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "password123" });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear refresh token cookie", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const user = await User.create({
        name: "Charlie",
        email: "charlie@test.com",
        passwordHash: await bcrypt.hash("pass", 12),
      });

      const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("charlie@test.com");
      expect(res.body.plan).toBe("free");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      const user = await User.create({
        name: "Dave",
        email: "dave@test.com",
        passwordHash: await bcrypt.hash("pass", 12),
      });

      const refreshTokenVal = jwt.sign(
        { userId: user._id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `refreshToken=${refreshTokenVal}`);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should return 401 without refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
    });
  });
});
