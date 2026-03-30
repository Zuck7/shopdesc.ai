import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2022",
        },
        module: { type: "es6" },
      },
    ],
  },
  setupFiles: ["<rootDir>/src/__tests__/env-setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 30000,
};

export default config;
