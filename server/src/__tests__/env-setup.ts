// This file runs before any test module is imported.
// It sets env vars that env.ts needs at parse time.
process.env.JWT_SECRET = "test-jwt-secret-min-32-chars-here-change-me";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-32-chars-here-change-me";
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27017/test"; // overridden by MongoMemoryServer
process.env.REDIS_URL = "redis://localhost:6379";
