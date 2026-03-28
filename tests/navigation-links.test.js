/**
 * Navigation Link Integrity Tests
 *
 * Statically verifies that every internal href used in HTML pages
 * corresponds to a declared clean-URL route (from public/_redirects).
 *
 * This catches the class of bugs where a page links to a route that has no
 * Netlify redirect rule — causing the catch-all /* to serve the login page
 * instead of the correct page (the "thrown out of the app" bug).
 *
 * Rules:
 *   - href="/"               → always valid (root / login page)
 *   - href="#"               → anchor-only, skip
 *   - href="/campaign/..."   → dynamic route, valid if /campaign/:id declared
 *   - href="http(s)://..."   → external, skip
 *   - everything else        → must appear in the KNOWN_ROUTES set below
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

// ---------------------------------------------------------------------------
// Source of truth: all clean-URL routes served by the app.
// Keep in sync with public/_redirects.
// ---------------------------------------------------------------------------
const KNOWN_ROUTES = new Set([
  "/",
  "/dashboard",
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
]);

// Routes with dynamic segments (prefix check is enough)
const DYNAMIC_PREFIXES = ["/campaign/"];

/** Return true if the href is a known internal route */
function isKnownRoute(href) {
  if (KNOWN_ROUTES.has(href)) return true;
  return DYNAMIC_PREFIXES.some((prefix) => href.startsWith(prefix));
}

/** Extract all href values from <a> tags only (not <link> elements) */
function extractHrefs(html) {
  // Match <a ...href="..."...> — only anchor tags, not <link rel="...">
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);
}

/** Filter to only internal, non-anchor, non-external hrefs */
function internalHrefs(hrefs) {
  return hrefs.filter(
    (h) => h.startsWith("/") && h !== "#" && !h.startsWith("//") && !h.startsWith("/assets")
  );
}

// ---------------------------------------------------------------------------
// Pages to check — every HTML file in the project
// ---------------------------------------------------------------------------
const pages = [
  { name: "index (login)",    path: "index.html" },
  { name: "Dashboard",        path: "src/pages/dashboard.html" },
  { name: "Create Campaign",  path: "src/pages/create-campaign.html" },
  { name: "Campaign Detail",  path: "src/pages/campaign-detail.html" },
  { name: "Profile",          path: "src/pages/profile.html" },
  { name: "Admin",            path: "src/pages/admin.html" },
  { name: "Rewards",          path: "src/pages/rewards.html" },
  { name: "Events",           path: "src/pages/events.html" },
  { name: "Stats",            path: "src/pages/stats.html" },
  { name: "Notifications",    path: "src/pages/notifications.html" },
  { name: "Terms",            path: "src/pages/terms.html" },
  { name: "Privacy",          path: "src/pages/privacy.html" },
  { name: "Forgot Password",  path: "src/pages/forgot-password.html" },
  { name: "Reset Password",   path: "src/pages/reset-password.html" },
];

describe("Navigation Links — every internal href has a declared route", () => {
  for (const { name, path } of pages) {
    it(`${name}: all internal hrefs are known routes`, () => {
      const html = readFileSync(resolve(ROOT, path), "utf-8");
      const hrefs = internalHrefs(extractHrefs(html));
      const unknown = hrefs.filter((h) => !isKnownRoute(h));

      if (unknown.length > 0) {
        console.error(`\n[${name}] Links to undeclared route(s):`);
        unknown.forEach((h) => console.error(`  ✗ href="${h}"`));
        console.error(
          `\n  Fix: add the route to public/_redirects AND to KNOWN_ROUTES in navigation-links.test.js\n`
        );
      }

      expect(unknown).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Cross-check: every route in _redirects (except catch-all) appears in KNOWN_ROUTES
// ---------------------------------------------------------------------------
describe("_redirects ↔ KNOWN_ROUTES are in sync", () => {
  const redirectsContent = readFileSync(resolve(ROOT, "public/_redirects"), "utf-8");

  // Extract "from" paths (first token on each line, skip catch-all and dynamic)
  const declaredRoutes = redirectsContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/)[0])
    .filter((r) => r !== "/*" && !r.includes(":"));

  it("every static route in _redirects is in KNOWN_ROUTES", () => {
    const missing = declaredRoutes.filter((r) => !KNOWN_ROUTES.has(r));
    if (missing.length > 0) {
      console.error("\nRoutes in _redirects but missing from KNOWN_ROUTES:");
      missing.forEach((r) => console.error(`  ✗ ${r}`));
      console.error("\n  Fix: add them to KNOWN_ROUTES in navigation-links.test.js\n");
    }
    expect(missing).toEqual([]);
  });

  it("every static route in KNOWN_ROUTES (except /) is in _redirects", () => {
    const withoutRoot = [...KNOWN_ROUTES].filter((r) => r !== "/");
    const missing = withoutRoot.filter((r) => !redirectsContent.includes(r));
    if (missing.length > 0) {
      console.error("\nRoutes in KNOWN_ROUTES but missing from _redirects:");
      missing.forEach((r) => console.error(`  ✗ ${r}`));
      console.error("\n  Fix: add them to public/_redirects\n");
    }
    expect(missing).toEqual([]);
  });
});
