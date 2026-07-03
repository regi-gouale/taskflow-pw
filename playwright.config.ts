import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // workers: 1,
  reporter: [["html"], ["line"], ["allure-playwright"]],
  use: {
    baseURL: appBaseUrl,
    trace: "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    storageState: "playwright/.auth/user.json",
  },
  globalSetup: "./utils/global-setup.ts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["tests/api/**"],
    },
    {
      name: "api",
      testMatch: ["tests/api/**/*.spec.ts"],
      use: {
        baseURL: process.env.API_BASE_URL ?? appBaseUrl,
        trace: "retain-on-failure",
        // storageState: "playwright/.auth/user.json",
      },
    },
  ],
});
