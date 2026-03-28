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
 *   - everything else        → must appear in KNOWN_ROUTES (derived from _redirects)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

// ---------------------------------------------------------------------------
// Source of truth: derived from public/_redirects (single source of truth).
// Adding a route to _redirects is enough — no need to update this file.
// ---------------------------------------------------------------------------
const redirectsContent = readFileSync(resolve(ROOT, "public/_redirects"), "utf-8");

const KNOWN_ROUTES = new Set([
  "/", // root is always valid but never appears as a redirect rule
  ...redirectsContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/)[0])
    .filter((r) => r !== "/*" && !r.includes(":")),
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
          `\n  Fix: add the route to public/_redirects — KNOWN_ROUTES is auto-derived from it.\n`
        );
      }

      expect(unknown).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Sanity check: _redirects has at least the minimum expected routes
// ---------------------------------------------------------------------------
describe("_redirects sanity check", () => {
  it("declares at least 12 static routes (catches accidental deletions)", () => {
    // KNOWN_ROUTES includes "/" (not a redirect rule) — dynamic routes with ":" are excluded
    const staticRouteCount = KNOWN_ROUTES.size - 1;
    expect(staticRouteCount).toBeGreaterThanOrEqual(12);
  });

  it("has a catch-all /* rule", () => {
    expect(redirectsContent).toMatch(/^\/\*/m);
  });
});
