/**
 * Visual Regression Tests — Playwright screenshot comparison
 *
 * Captures full-page screenshots for 6 pages and compares them against
 * stored baselines. Fails if pixel diff exceeds 2%.
 *
 * Setup (first time):
 *   npx playwright install chromium
 *   npm run preview          # start vite preview on :4173
 *   npx playwright test --update-snapshots
 *
 * Daily run (CI):
 *   npm run preview &
 *   npx playwright test
 */

import { test, expect } from "@playwright/test";

// Pages reachable without authentication (demo mode auto-login via URL param is not used here)
// Public pages are tested at full page level; auth pages use demo login flow.

const PUBLIC_PAGES = [
  { name: "login", path: "/" },
];

// Pages that require demo login first
const AUTH_PAGES = [
  { name: "dashboard",        path: "/src/pages/dashboard.html" },
  { name: "campaign-detail",  path: "/src/pages/campaign-detail.html?id=demo-campaign-1" },
  { name: "create-campaign",  path: "/src/pages/create-campaign.html" },
  { name: "profile",          path: "/src/pages/profile.html" },
  { name: "rewards",          path: "/src/pages/rewards.html" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function demoLogin(page) {
  await page.goto("/");
  // Click demo button (matches both BG and EN label)
  await page.getByRole("button", { name: /demo|демо/i }).click();
  await page.waitForURL(/dashboard/);
}

// ── Public pages ──────────────────────────────────────────────────────────────

for (const { name, path } of PUBLIC_PAGES) {
  test(`visual — ${name} (desktop)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });
}

// ── Authenticated pages ───────────────────────────────────────────────────────

test.describe("Authenticated pages", () => {
  test.beforeEach(async ({ page }) => {
    await demoLogin(page);
  });

  for (const { name, path } of AUTH_PAGES) {
    test(`visual — ${name} (desktop)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // Give dynamic content (weather widget, campaign list) a moment to settle
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        maxDiffPixelRatio: 0.02,
        fullPage: true,
      });
    });
  }
});

// ── Mobile viewport ───────────────────────────────────────────────────────────

test.describe("Mobile viewport (iPhone 13)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("visual — login (mobile)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("login-mobile.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  test("visual — dashboard (mobile)", async ({ page }) => {
    await demoLogin(page);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });
});
