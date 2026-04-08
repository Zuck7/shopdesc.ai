import { db } from "../../config/db.js";
import { users, bulkJobs } from "../../models/schema.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe("BulkJob table", () => {
  let userId: string;

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({ email: "bulk@test.com", name: "Bulk User", passwordHash: "hash" })
      .returning();
    userId = user!.id;
  });

  const base = () => ({
    userId,
    productIds: [crypto.randomUUID(), crypto.randomUUID()],
    totalProducts: 2,
  });

  it("should create a bulk job with defaults", async () => {
    const [job] = await db.insert(bulkJobs).values(base()).returning();
    expect(job!.status).toBe("queued");
    expect(job!.platform).toBe("generic");
    expect(job!.tone).toBe("professional");
    expect(job!.includeCompetitor).toBe(false);
    expect(job!.completedProducts).toBe(0);
    expect(job!.failedProducts).toBe(0);
    expect(job!.createdAt).toBeDefined();
  });

  it("should accept all valid statuses", async () => {
    for (const status of [
      "queued",
      "processing",
      "completed",
      "failed",
      "cancelled",
    ] as const) {
      const [job] = await db.insert(bulkJobs).values({ ...base(), status }).returning();
      expect(job!.status).toBe(status);
    }
  });

  it("should store startedAt and completedAt dates", async () => {
    const now = new Date();
    const [job] = await db
      .insert(bulkJobs)
      .values({ ...base(), startedAt: now, completedAt: now })
      .returning();
    expect(job!.startedAt).toEqual(now);
    expect(job!.completedAt).toEqual(now);
  });
});
