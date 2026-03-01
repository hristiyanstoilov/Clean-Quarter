/**
 * Service Worker Logic Tests
 *
 * Tests the routing and caching strategy logic extracted from public/service-worker.js.
 * We test the pure decision logic (which requests to intercept, which strategy to use)
 * without requiring an actual service worker environment.
 *
 * Critical fix tested: external URLs (OSM tiles, CDNs) must be skipped so the SW
 * never calls fetch() on them — which would be blocked by connect-src CSP.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const SW_PATH = resolve(process.cwd(), "public/service-worker.js");
const swSource = readFileSync(SW_PATH, "utf-8");

// ---------------------------------------------------------------------------
// Pure routing logic — mirroring the fetch handler in service-worker.js
// ---------------------------------------------------------------------------

const ORIGIN = "https://cleanquarter.netlify.app";

/**
 * Mirrors the fetch handler decision tree from service-worker.js.
 * Returns what the SW would do with a given request.
 */
function classifyRequest(method, url) {
  if (method !== "GET") return "skip-non-get";

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "skip-invalid-url";
  }

  if (parsed.origin !== ORIGIN) return "skip-external";

  if (parsed.pathname.includes("/rest/v1/")) return "network-first";

  return "cache-first";
}

// ---------------------------------------------------------------------------
// Source-level static checks
// ---------------------------------------------------------------------------

describe("Service Worker — source code static checks", () => {
  it("skips external URLs to prevent connect-src CSP violations", () => {
    expect(swSource).toContain("url.origin !== self.location.origin");
    expect(swSource).toContain("return;");
  });

  it("uses CACHE_NAME constant for all cache operations", () => {
    const cacheNameDecl = swSource.match(/const CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
    expect(cacheNameDecl).not.toBeNull();
    // All caches.open() calls must reference CACHE_NAME
    const openCalls = [...swSource.matchAll(/caches\.open\(([^)]+)\)/g)].map((m) => m[1].trim());
    expect(openCalls.length).toBeGreaterThan(0);
    openCalls.forEach((arg) => {
      expect(arg).toBe("CACHE_NAME");
    });
  });

  it("skips non-GET requests", () => {
    expect(swSource).toContain("request.method !== 'GET'");
  });

  it("uses network-first strategy for Supabase REST API calls", () => {
    expect(swSource).toContain("/rest/v1/");
    // Network-first: tries fetch() first, falls back to cache
    const restBlock = swSource.slice(
      swSource.indexOf("/rest/v1/"),
      swSource.indexOf("/rest/v1/") + 700
    );
    expect(restBlock).toContain("fetch(request)");
    // caches.match(request) is in the .catch() fallback ~570 chars in
    expect(restBlock).toContain("caches.match(request)");
  });

  it("uses cache-first strategy for static assets", () => {
    // Cache-first: checks cache before network
    expect(swSource).toContain("caches.match(request)");
  });

  it("calls self.skipWaiting() on install to activate immediately", () => {
    expect(swSource).toContain("self.skipWaiting()");
  });

  it("calls self.clients.claim() on activate to control all open pages", () => {
    expect(swSource).toContain("self.clients.claim()");
  });

  it("cleans up old caches on activate", () => {
    expect(swSource).toContain("caches.keys()");
    expect(swSource).toContain("caches.delete(cacheName)");
  });

  it("does not cache CDN resources in STATIC_ASSETS", () => {
    const staticAssetsBlock = swSource.slice(
      swSource.indexOf("const STATIC_ASSETS"),
      swSource.indexOf("];")
    );
    expect(staticAssetsBlock).not.toContain("cdn.jsdelivr.net");
    expect(staticAssetsBlock).not.toContain("cdnjs.cloudflare.com");
    expect(staticAssetsBlock).not.toContain("tile.openstreetmap.org");
  });

  it("does not use crossOrigin in tileLayer options (removed to avoid SW interception)", () => {
    // The SW should not attempt to fetch tile URLs — they are excluded by origin check
    // Confirming SW source itself does not reference crossOrigin
    expect(swSource).not.toContain("crossOrigin");
  });
});

// ---------------------------------------------------------------------------
// Routing logic unit tests
// ---------------------------------------------------------------------------

describe("Service Worker — fetch routing logic", () => {
  it("skips POST, PUT, DELETE, PATCH requests", () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      expect(classifyRequest(method, `${ORIGIN}/rest/v1/campaigns`)).toBe("skip-non-get");
    }
  });

  it("skips OSM tile requests (external origin)", () => {
    const tileUrl = "https://a.tile.openstreetmap.org/12/2345/1567.png";
    expect(classifyRequest("GET", tileUrl)).toBe("skip-external");
  });

  it("skips CDN requests (external origin)", () => {
    const cdnUrls = [
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
    ];
    cdnUrls.forEach((url) => {
      expect(classifyRequest("GET", url)).toBe("skip-external");
    });
  });

  it("skips Supabase Storage CDN requests (external origin)", () => {
    const storageUrl =
      "https://hulwbevuvbepnjpikjht.supabase.co/storage/v1/object/public/avatars/test.jpg";
    expect(classifyRequest("GET", storageUrl)).toBe("skip-external");
  });

  it("uses network-first for Supabase REST API calls", () => {
    const apiUrl = `${ORIGIN}/rest/v1/campaigns?select=*`;
    expect(classifyRequest("GET", apiUrl)).toBe("network-first");
  });

  it("uses network-first for all /rest/v1/ sub-paths", () => {
    const paths = [
      "/rest/v1/campaigns",
      "/rest/v1/profiles?id=eq.123",
      "/rest/v1/participations",
      "/rest/v1/rewards",
    ];
    paths.forEach((path) => {
      expect(classifyRequest("GET", `${ORIGIN}${path}`)).toBe("network-first");
    });
  });

  it("uses cache-first for same-origin static assets", () => {
    const staticUrls = [
      `${ORIGIN}/`,
      `${ORIGIN}/index.html`,
      `${ORIGIN}/assets/main-abc123.js`,
      `${ORIGIN}/assets/style-def456.css`,
      `${ORIGIN}/src/pages/dashboard.html`,
    ];
    staticUrls.forEach((url) => {
      expect(classifyRequest("GET", url)).toBe("cache-first");
    });
  });
});

// ---------------------------------------------------------------------------
// Cache name versioning
// ---------------------------------------------------------------------------

describe("Service Worker — cache versioning", () => {
  it("CACHE_NAME follows expected naming convention", () => {
    const match = swSource.match(/const CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
    expect(match).not.toBeNull();
    const cacheName = match[1];
    // Must contain a version suffix (e.g. -v2, -v3)
    expect(cacheName).toMatch(/^[\w-]+-v\d+$/);
  });
});
