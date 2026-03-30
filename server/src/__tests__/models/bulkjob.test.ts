import mongoose from "mongoose";
import BulkJob from "../../models/BulkJob.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const userId = new mongoose.Types.ObjectId();

describe("BulkJob Model", () => {
  const validJob = {
    userId,
    productIds: [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ],
    totalProducts: 2,
  };

  it("should create a bulk job with defaults", async () => {
    const job = await BulkJob.create(validJob);
    expect(job.status).toBe("queued");
    expect(job.platform).toBe("generic");
    expect(job.tone).toBe("professional");
    expect(job.includeCompetitor).toBe(false);
    expect(job.completedProducts).toBe(0);
    expect(job.failedProducts).toBe(0);
    expect(job.createdAt).toBeDefined();
  });

  it("should require userId", async () => {
    const { userId: _u, ...rest } = validJob;
    await expect(BulkJob.create(rest)).rejects.toThrow();
  });

  it("should reject invalid status", async () => {
    await expect(
      BulkJob.create({ ...validJob, status: "invalid" })
    ).rejects.toThrow();
  });

  it("should accept all valid statuses", async () => {
    for (const status of [
      "queued",
      "processing",
      "completed",
      "failed",
      "cancelled",
    ]) {
      const job = await BulkJob.create({ ...validJob, status });
      expect(job.status).toBe(status);
    }
  });

  it("should reject invalid platform", async () => {
    await expect(
      BulkJob.create({ ...validJob, platform: "invalid" })
    ).rejects.toThrow();
  });

  it("should store startedAt and completedAt dates", async () => {
    const now = new Date();
    const job = await BulkJob.create({
      ...validJob,
      startedAt: now,
      completedAt: now,
    });
    expect(job.startedAt).toEqual(now);
    expect(job.completedAt).toEqual(now);
  });
});
