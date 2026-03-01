/**
 * CSS Integrity Tests
 *
 * Statically verifies that critical CSS rules are present in the stylesheet files.
 * Focuses on fixes that must be maintained to prevent visual regressions.
 *
 * Key fix tested: Leaflet 1.9.x adds `mix-blend-mode: plus-lighter` to tile images,
 * causing them to wash out to white on light (#ddd) backgrounds. Our override must
 * use !important because Leaflet CSS loads AFTER helpers CSS in Vite's build output.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

const globalStyle = readFileSync(resolve(ROOT, "src/assets/style.css"), "utf-8");
const mobileStyle = readFileSync(resolve(ROOT, "src/styles/mobile-responsive.css"), "utf-8");

// ---------------------------------------------------------------------------
// Leaflet tile fix
// ---------------------------------------------------------------------------

describe("CSS Integrity — Leaflet 1.9.x tile fix", () => {
  it("overrides mix-blend-mode on .leaflet-container img.leaflet-tile", () => {
    expect(globalStyle).toContain(".leaflet-container img.leaflet-tile");
  });

  it("sets mix-blend-mode: normal (not plus-lighter)", () => {
    expect(globalStyle).toContain("mix-blend-mode: normal");
    expect(globalStyle).not.toMatch(/\.leaflet-container img\.leaflet-tile[\s\S]{0,100}mix-blend-mode:\s*plus-lighter/);
  });

  it("uses !important to override Leaflet CSS loaded after helpers CSS", () => {
    // Without !important the rule has no effect because Leaflet CSS loads last
    const tileRuleBlock = globalStyle.slice(
      globalStyle.indexOf(".leaflet-container img.leaflet-tile"),
      globalStyle.indexOf(".leaflet-container img.leaflet-tile") + 200
    );
    expect(tileRuleBlock).toContain("!important");
  });
});

// ---------------------------------------------------------------------------
// Map container dimensions
// ---------------------------------------------------------------------------

describe("CSS Integrity — map container styles", () => {
  it(".map-container has an explicit height", () => {
    const mapContainerBlock = globalStyle.slice(
      globalStyle.indexOf(".map-container"),
      globalStyle.indexOf(".map-container") + 200
    );
    expect(mapContainerBlock).toMatch(/height:\s*\d+px/);
  });

  it("#map fills its container (width and height 100%)", () => {
    const mapIdBlock = globalStyle.slice(
      globalStyle.indexOf("#map {"),
      globalStyle.indexOf("#map {") + 100
    );
    expect(mapIdBlock).toContain("width: 100%");
    expect(mapIdBlock).toContain("height: 100%");
  });
});

// ---------------------------------------------------------------------------
// No CDN @import or url() in CSS files (all external resources use HTML <link>)
// ---------------------------------------------------------------------------

describe("CSS Integrity — no external CDN URLs in CSS files", () => {
  const cssFiles = [
    { name: "style.css", source: globalStyle },
    { name: "mobile-responsive.css", source: mobileStyle },
  ];

  const bannedDomains = [
    "cdn.jsdelivr.net",
    "cdnjs.cloudflare.com",
    "raw.githubusercontent.com",
    "unpkg.com",
  ];

  cssFiles.forEach(({ name, source }) => {
    bannedDomains.forEach((domain) => {
      it(`${name} does not import from ${domain}`, () => {
        // Allow domain name in comments but not in url() or @import
        const nonCommentLines = source
          .split("\n")
          .filter((line) => !line.trim().startsWith("/*") && !line.trim().startsWith("*") && !line.trim().startsWith("//"));
        const problematic = nonCommentLines.filter((line) => line.includes(domain));
        expect(problematic).toEqual([]);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Design system variables defined
// ---------------------------------------------------------------------------

describe("CSS Integrity — design system :root variables", () => {
  const requiredVars = [
    "--primary-color",
    "--shadow-sm",
    "--shadow-md",
    "--radius-md",
    "--transition-base",
  ];

  requiredVars.forEach((varName) => {
    it(`defines CSS variable ${varName}`, () => {
      expect(globalStyle).toContain(varName);
    });
  });
});

// ---------------------------------------------------------------------------
// Mobile responsive file covers key breakpoints
// ---------------------------------------------------------------------------

describe("CSS Integrity — mobile breakpoints", () => {
  it("mobile-responsive.css has at least one @media query", () => {
    expect(mobileStyle).toContain("@media");
  });

  it("mobile-responsive.css targets max-width 768px (tablet/phone)", () => {
    expect(mobileStyle).toContain("768px");
  });
});
