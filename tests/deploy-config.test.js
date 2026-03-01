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
