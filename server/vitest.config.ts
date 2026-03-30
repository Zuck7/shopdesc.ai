import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./src",
    include: ["__tests__/**/*.test.ts"],
    testTimeout: 30000,
    setupFiles: ["./__tests__/env-setup.ts"],
  },
});
