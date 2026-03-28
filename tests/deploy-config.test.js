/**
 * Netlify Deploy Configuration Tests
 *
 * Statically verifies that public/_redirects and public/_headers contain
 * the required routing rules and security headers for production deployment.
 *
 * These files are copied verbatim from public/ into dist/ by Vite's build,
 * so they apply to both manual drag-and-drop deploys and git-based deploys.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

const redirectsSource = readFileSync(resolve(ROOT, "public/_redirects"), "utf-8");
const headersSource = readFileSync(resolve(ROOT, "public/_headers"), "utf-8");

// ---------------------------------------------------------------------------
// _redirects
// ---------------------------------------------------------------------------

describe("Netlify _redirects — route coverage", () => {
  const requiredRoutes = [
    "/dashboard",
    "/campaign/:id",
    "/create-campaign",
    "/profile",
    "/rewards",
    "/admin",
    "/events",
    "/stats",
    "/notifications",
    "/terms",
    "/privacy",
    "/forgot-password",
    "/reset-password",
  ];

  requiredRoutes.forEach((route) => {
    it(`has a redirect rule for ${route}`, () => {
      expect(redirectsSource).toContain(route);
    });
  });

  it("has a SPA fallback rule /* → /index.html", () => {
    expect(redirectsSource).toMatch(/\/\*\s+\/index\.html\s+200/);
  });

  it("all route rules return 200 (rewrite, not redirect)", () => {
    const lines = redirectsSource
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    lines.forEach((line) => {
      // Each non-comment line must end with 200
      expect(line).toMatch(/\s200$/);
    });
  });

  it("campaign detail route uses :id parameter", () => {
    expect(redirectsSource).toContain("/campaign/:id");
  });

  it("dashboard route maps to dashboard.html", () => {
    expect(redirectsSource).toMatch(/\/dashboard\s+\/src\/pages\/dashboard\.html/);
  });
});

// ---------------------------------------------------------------------------
// _headers — security headers
// ---------------------------------------------------------------------------

describe("Netlify _headers — security headers present", () => {
  const requiredHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Strict-Transport-Security",
    "Permissions-Policy",
    "Content-Security-Policy",
  ];

  requiredHeaders.forEach((header) => {
    it(`sets ${header} header`, () => {
      expect(headersSource).toContain(header);
    });
  });

  it("X-Frame-Options is set to DENY", () => {
    expect(headersSource).toContain("X-Frame-Options: DENY");
  });

  it("Strict-Transport-Security includes includeSubDomains and preload", () => {
    expect(headersSource).toContain("includeSubDomains");
    expect(headersSource).toContain("preload");
  });

  it("X-Content-Type-Options is nosniff", () => {
    expect(headersSource).toContain("X-Content-Type-Options: nosniff");
  });
});

// ---------------------------------------------------------------------------
// _headers — Content Security Policy
// ---------------------------------------------------------------------------

describe("Netlify _headers — CSP directives", () => {
  // Extract the full CSP line
  const cspLine = headersSource
    .split("\n")
    .find((l) => l.includes("Content-Security-Policy:"));

  it("has a Content-Security-Policy directive", () => {
    expect(cspLine).toBeDefined();
  });

  it("CSP allows scripts from jsdelivr CDN", () => {
    expect(cspLine).toContain("cdn.jsdelivr.net");
  });

  it("CSP allows scripts from cdnjs CDN", () => {
    expect(cspLine).toContain("cdnjs.cloudflare.com");
  });

  it("CSP connect-src allows Supabase HTTPS", () => {
    expect(cspLine).toContain("https://*.supabase.co");
  });

  it("CSP connect-src allows Supabase WebSocket", () => {
    expect(cspLine).toContain("wss://*.supabase.co");
  });

  it("CSP img-src allows https: for external images (maps, avatars)", () => {
    expect(cspLine).toContain("img-src");
    expect(cspLine).toContain("https:");
  });

  it("CSP sets frame-ancestors to none (clickjacking protection)", () => {
    expect(cspLine).toContain("frame-ancestors 'none'");
  });

  it("CSP has default-src 'self'", () => {
    expect(cspLine).toContain("default-src 'self'");
  });

  it("admin.html does not load scripts or styles from unpkg.com (not in CSP)", () => {
    const adminHtml = readFileSync(resolve(ROOT, "src/pages/admin.html"), "utf-8");
    expect(adminHtml).not.toContain("unpkg.com");
  });
});

// ---------------------------------------------------------------------------
// campaign-detail.js — i18n completeness
// ---------------------------------------------------------------------------

describe("campaign-detail.js — no hardcoded EN status strings", () => {
  const cdSrc = readFileSync(resolve(ROOT, "src/scripts/campaign-detail.js"), "utf-8");

  it("showSubmissionStatus uses t() for joined status (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Upload your after photo to submit proof."');
    expect(cdSrc).toContain('t("campaign.joined")');
  });

  it("showSubmissionStatus uses t() for pending status (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Waiting for admin approval..."');
    expect(cdSrc).toContain('t("campaign.proofSubmitted")');
  });

  it("showSubmissionStatus uses t() for approved status (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Your proof has been approved! Points awarded."');
    expect(cdSrc).toContain('t("campaign.proofApproved")');
  });

  it("handleDelete Swal uses t() for title and confirm button (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Delete Campaign?"');
    expect(cdSrc).not.toContain('"Yes, Delete It"');
    expect(cdSrc).toContain('t("campaign.deleteTitle")');
    expect(cdSrc).toContain('t("campaign.deleteConfirm")');
  });

  it("renderComments hoists localStorage.getItem outside .map() loop", () => {
    const mapIndex = cdSrc.indexOf("list.innerHTML = comments");
    const langIndex = cdSrc.indexOf('localStorage.getItem("CLEAN_QUARTER_LANGUAGE")');
    // langIndex must appear BEFORE mapIndex (hoisted above .map())
    expect(langIndex).toBeGreaterThan(0);
    expect(langIndex).toBeLessThan(mapIndex);
  });
});

// ---------------------------------------------------------------------------
// dashboard.js — no inline event handlers
// ---------------------------------------------------------------------------

describe("dashboard.js — inline event handler hygiene", () => {
  const dashSrc = readFileSync(resolve(ROOT, "src/scripts/dashboard.js"), "utf-8");

  it("does not use inline onerror= attributes (uses wireImageFallbacks instead)", () => {
    expect(dashSrc).not.toContain("onerror=");
  });

  it("defines wireImageFallbacks helper for post-render error wiring", () => {
    expect(dashSrc).toContain("wireImageFallbacks");
    expect(dashSrc).toContain("js-campaign-img");
  });
});

// ---------------------------------------------------------------------------
// _headers — cache control for assets
// ---------------------------------------------------------------------------

describe("Netlify _headers — static asset caching", () => {
  it("sets long-lived cache for /assets/* (immutable hashed files)", () => {
    expect(headersSource).toContain("/assets/*");
    expect(headersSource).toContain("Cache-Control");
    expect(headersSource).toContain("immutable");
  });

  it("sets max-age of at least 1 year for /assets/*", () => {
    const maxAgeMatch = headersSource.match(/max-age=(\d+)/);
    expect(maxAgeMatch).not.toBeNull();
    const maxAge = parseInt(maxAgeMatch[1], 10);
    // 1 year = 31536000 seconds
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });
});

// ---------------------------------------------------------------------------
// campaign-detail.js — upload & edit Swal i18n
// ---------------------------------------------------------------------------

describe("campaign-detail.js — upload and edit Swal i18n", () => {
  const cdSrc = readFileSync(resolve(ROOT, "src/scripts/campaign-detail.js"), "utf-8");

  it("upload Swal uses t() for title (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Uploading photo..."');
    expect(cdSrc).toContain('t("campaign.uploadingPhoto")');
  });

  it("edit validation Swal uses t() for text (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Title and description are required!"');
    expect(cdSrc).toContain('t("campaign.editRequiredFields")');
  });

  it("edit save Swal uses t() for title (not hardcoded EN)", () => {
    expect(cdSrc).not.toContain('"Saving..."');
    expect(cdSrc).toContain('t("campaign.saving")');
  });

  it('edit save Swal uses t("common.loading") for text (not hardcoded EN)', () => {
    expect(cdSrc).not.toContain('"Please wait"');
    expect(cdSrc).toContain('t("common.loading")');
  });
});

// ---------------------------------------------------------------------------
// rewards.js — no inline localStorage reads in Swal dialogs
// ---------------------------------------------------------------------------

describe("rewards.js — Swal dialogs use t() not inline localStorage", () => {
  const rewardsSrc = readFileSync(resolve(ROOT, "src/scripts/rewards.js"), "utf-8");

  it("handleBuy does not read localStorage inline inside Swal", () => {
    // All localStorage reads inside handleBuy should be gone
    expect(rewardsSrc).not.toContain(
      '(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg") === "en"'
    );
  });

  it('handleBuy uses t("rewards.confirmPurchaseTitle") for confirmation title', () => {
    expect(rewardsSrc).toContain('t("rewards.confirmPurchaseTitle")');
  });

  it('handleBuy uses t("rewards.insufficientPointsTitle") for error title', () => {
    expect(rewardsSrc).toContain('t("rewards.insufficientPointsTitle")');
  });

  it('renderRewards uses t() for empty-state strings (not inline ternaries)', () => {
    expect(rewardsSrc).toContain('t("rewards.noRewardsTitle")');
    expect(rewardsSrc).toContain('t("rewards.noRewardsText")');
  });

  it('renderRewards uses t() for button labels', () => {
    expect(rewardsSrc).toContain('t("rewards.outOfStock")');
    expect(rewardsSrc).toContain('t("rewards.buyBtn")');
    expect(rewardsSrc).toContain('t("rewards.notEnoughPoints")');
  });
});

// ---------------------------------------------------------------------------
// create-campaign.js — Swal error i18n
// ---------------------------------------------------------------------------

describe("create-campaign.js — Swal error uses t() not inline localStorage", () => {
  const ccSrc = readFileSync(resolve(ROOT, "src/scripts/create-campaign.js"), "utf-8");

  it("catch Swal text uses t() (not inline localStorage ternary)", () => {
    expect(ccSrc).not.toContain(
      '(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg") === "en"'
    );
    expect(ccSrc).toContain('t("createCampaign.createError")');
  });
});

// ---------------------------------------------------------------------------
// admin.js — no unsafe inline onclick with user data
// ---------------------------------------------------------------------------

describe("admin.js — user data passed via data-* not inline onclick", () => {
  const adminSrc = readFileSync(resolve(ROOT, "src/scripts/admin.js"), "utf-8");

  it("handleApprove is not called via inline onclick= attribute", () => {
    expect(adminSrc).not.toContain('onclick="handleApprove(');
  });

  it("handleReject is not called via inline onclick= attribute", () => {
    expect(adminSrc).not.toContain('onclick="handleReject(');
  });

  it("removeAdmin is not called via inline onclick= attribute", () => {
    expect(adminSrc).not.toContain('onclick="window.removeAdmin(');
  });

  it("makeAdmin is not called via inline onclick= attribute", () => {
    expect(adminSrc).not.toContain('onclick="window.makeAdmin(');
  });

  it("photo thumbnails use data-photo-url (not inline onclick)", () => {
    expect(adminSrc).toContain("js-photo-modal");
    expect(adminSrc).toContain("data-photo-url");
    expect(adminSrc).not.toContain("onclick=\"showPhotoModal(");
  });

  it("user action buttons use data-action (not inline onclick)", () => {
    expect(adminSrc).toContain("js-user-action");
    expect(adminSrc).toContain('data-action=');
  });
});
