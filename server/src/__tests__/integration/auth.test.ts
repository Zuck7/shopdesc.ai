import request from "supertest";
import { app } from "../../app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";
import { createAuthenticatedUser } from "../helpers.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user and return token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          password: "securepass123",
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("jane@example.com");
      expect(res.body.user.name).toBe("Jane Doe");
      expect(res.body.user.plan).toBe("free");
      expect(res.body.accessToken).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "First",
          email: "dupe@example.com",
          password: "securepass123",
        });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Second",
          email: "dupe@example.com",
          password: "securepass456",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Email already registered");
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: "short@example.com",
          password: "short",
        });

      expect(res.status).toBe(400);
    });

    it("should reject missing name", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "noname@example.com",
          password: "securepass123",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Login User",
          email: "login@example.com",
          password: "securepass123",
        });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@example.com", password: "securepass123" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe("login@example.com");
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@example.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should reject non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nope@example.com", password: "securepass123" });

      expect(res.status).toBe(401);
    });

    it("should set refreshToken cookie on login", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@example.com", password: "securepass123" });

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.toString()).toContain("refreshToken");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const { token } = await createAuthenticatedUser({
        email: "me@example.com",
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("me@example.com");
      expect(res.body.plan).toBeDefined();
    });

    it("should reject missing token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should issue new access token with valid refresh cookie", async () => {
      // Register and login to get refresh cookie
      const loginRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Refresh User",
          email: "refresh@example.com",
          password: "securepass123",
        });

      const cookies = loginRes.headers["set-cookie"];

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should reject missing refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh");
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
});
