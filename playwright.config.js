import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression configuration.
 * Run with: npx playwright test --project=chromium
 *
 * First run (no snapshots yet): npx playwright test --update-snapshots
 * CI: runs against existing snapshots, fails on diff > 2%.
 *
 * Note: requires `npm run preview` (or `npm run dev`) running on port 4173.
 */
export default defineConfig({
  testDir: "./playwright",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
