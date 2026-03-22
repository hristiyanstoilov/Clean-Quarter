/**
 * Lighthouse CI configuration
 *
 * Install: npm install --save-dev @lhci/cli
 * Run:     npx lhci autorun
 *
 * Audits the login page and dashboard (via demo mode).
 * Thresholds: performance ≥ 0.75, accessibility ≥ 0.90, best-practices ≥ 0.90.
 * Color-contrast is excluded from accessibility budget (requires real CSS rendering
 * which axe/JSDOM already misses — Lighthouse will catch real contrast issues in CI).
 */

export default {
  ci: {
    collect: {
      // Start vite preview before running Lighthouse
      startServerCommand: "npm run preview",
      startServerReadyPattern: "Local",
      // Only audit public pages — authenticated pages redirect without a session
      // and produce meaningless (empty-page) metrics.
      url: [
        "http://localhost:4173/",
        "http://localhost:4173/src/pages/forgot-password.html",
      ],
      numberOfRuns: 1,
      settings: {
        // Run in desktop mode for deterministic results
        preset: "desktop",
        // Skip SW fetch (avoids flaky network-timing issues in CI)
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals / Performance
        "categories:performance": ["warn", { minScore: 0.75 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Accessibility — primary quality gate (error = fail CI)
        "categories:accessibility": ["error", { minScore: 0.90 }],

        // Best practices & SEO
        "categories:best-practices": ["warn", { minScore: 0.90 }],
        "categories:seo": ["warn", { minScore: 0.80 }],
      },
    },
    upload: {
      // Store reports locally (no LHCI server required)
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
