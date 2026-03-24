// @vitest-environment jsdom
/**
 * Accessibility Tests — axe-core static analysis
 *
 * Loads each HTML page into the vitest jsdom environment and runs axe-core.
 * Catches structural a11y violations: missing alt, unlabelled inputs,
 * buttons without accessible names, missing lang/title, invalid ARIA.
 *
 * Color contrast is excluded (requires rendered CSS — not available in JSDOM).
 * Script execution is off (module imports won't load) — structural checks only.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, beforeEach } from "vitest";
import axe from "axe-core";

// Polyfill browser APIs that jsdom doesn't implement but axe-core requires
if (typeof document !== "undefined" && !document.elementsFromPoint) {
  document.elementsFromPoint = () => [];
}

// axe-core + JSDOM can be slow on complex pages — increase timeout to 30s
const AXE_TIMEOUT = 30_000;

const ROOT = resolve(process.cwd());

// ─── Pages to test ────────────────────────────────────────────────────────────

const pages = [
  { name: "Login / Register", path: "index.html" },
  { name: "Dashboard",        path: "src/pages/dashboard.html" },
  { name: "Campaign Detail",  path: "src/pages/campaign-detail.html" },
  { name: "Create Campaign",  path: "src/pages/create-campaign.html" },
  { name: "Profile",          path: "src/pages/profile.html" },
  { name: "Rewards",          path: "src/pages/rewards.html" },
  { name: "Admin",            path: "src/pages/admin.html" },
  { name: "Stats",            path: "src/pages/stats.html" },
  { name: "Forgot Password",  path: "src/pages/forgot-password.html" },
  { name: "Reset Password",   path: "src/pages/reset-password.html" },
];

// axe rules that can reliably run on static HTML without CSS or JS execution.
// color-contrast requires rendered styles → excluded.
const AXE_RULES_DISABLED = ["color-contrast", "color-contrast-enhanced"];

// ─── axe-core runner ──────────────────────────────────────────────────────────

async function runAxe(html) {
  // Load the HTML into the vitest jsdom global document
  document.open();
  document.write(html);
  document.close();

  // Ensure polyfill is present after document.open/close resets the DOM
  if (!document.elementsFromPoint) {
    document.elementsFromPoint = () => [];
  }

  return axe.run(document, {
    rules: Object.fromEntries(
      AXE_RULES_DISABLED.map((id) => [id, { enabled: false }])
    ),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Accessibility — axe-core (critical + serious violations)", () => {
  pages.forEach(({ name, path }) => {
    it(`${name} — no critical violations`, async () => {
      const html = readFileSync(resolve(ROOT, path), "utf-8");
      const results = await runAxe(html);

      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      if (blocking.length > 0) {
        const detail = blocking
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description}`)
          .join("\n");
        expect.fail(`${name} has ${blocking.length} a11y violation(s):\n${detail}`);
      }

      expect(blocking).toHaveLength(0);
    }, AXE_TIMEOUT);
  });
});

// ─── Structural checks (no DOM needed) ───────────────────────────────────────

describe("Accessibility — structural HTML checks", () => {
  pages.forEach(({ name, path }) => {
    const html = readFileSync(resolve(ROOT, path), "utf-8");

    it(`${name} — <html> has lang attribute`, () => {
      expect(html).toMatch(/<html[^>]+lang=/i);
    });

    it(`${name} — has <title> tag`, () => {
      expect(html).toMatch(/<title[^>]*>.+<\/title>/i);
    });

    it(`${name} — images have alt attributes`, () => {
      // Find all <img> tags
      const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
      imgs.forEach((img) => {
        // Skip inline SVG-referenced images without meaningful content
        if (img.includes("role=\"presentation\"") || img.includes("aria-hidden")) return;
        expect(img).toMatch(/\balt=/i);
      });
    });

    it(`${name} — buttons have accessible names`, () => {
      // Buttons with no text content AND no aria-label are inaccessible
      const emptyBtns = [
        ...html.matchAll(/<button\b(?![^>]*aria-label)[^>]*>\s*<\/button>/gi),
      ];
      expect(emptyBtns).toHaveLength(0);
    });
  });
});

// ─── Form accessibility checks ────────────────────────────────────────────────

describe("Accessibility — form inputs have labels", () => {
  const formPages = [
    { name: "Login / Register", path: "index.html" },
    { name: "Create Campaign",  path: "src/pages/create-campaign.html" },
    { name: "Profile",          path: "src/pages/profile.html" },
    { name: "Forgot Password",  path: "src/pages/forgot-password.html" },
    { name: "Reset Password",   path: "src/pages/reset-password.html" },
  ];

  formPages.forEach(({ name, path }) => {
    const html = readFileSync(resolve(ROOT, path), "utf-8");

    it(`${name} — text inputs have id attributes (for label association)`, () => {
      const textInputs = [
        ...html.matchAll(/<input\b(?=[^>]*type=["'](text|email|password|number|search)["'])[^>]*>/gi),
      ].map((m) => m[0]);

      textInputs.forEach((input) => {
        const hasId = /\bid=["'][^"']+["']/i.test(input);
        const hasAriaLabel = /\baria-label(ledby)?=["'][^"']+["']/i.test(input);
        expect(hasId || hasAriaLabel).toBe(true);
      });
    });
  });
});
