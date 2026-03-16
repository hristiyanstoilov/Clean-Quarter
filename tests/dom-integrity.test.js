/**
 * DOM Integrity Tests
 *
 * Statically verifies that every getElementById("X") call in a page's JS file
 * has a matching id="X" in the corresponding HTML file.
 *
 * This prevents the class of bugs where JS references an element that was
 * never added to the HTML (or was accidentally removed), causing a TypeError
 * at runtime that crashes the whole page initialization.
 *
 * If an element is intentionally optional (accessed with ?. and may not exist),
 * add its id to the page's `optionalIds` list below.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

const pages = [
  {
    name: "Dashboard",
    html: "src/pages/dashboard.html",
    js: "src/scripts/dashboard.js",
    // IDs intentionally absent from HTML (used with ?. or added dynamically)
    optionalIds: [],
  },
  {
    name: "Rewards",
    html: "src/pages/rewards.html",
    js: "src/scripts/rewards.js",
    optionalIds: [],
  },
  {
    name: "Profile",
    html: "src/pages/profile.html",
    js: "src/scripts/profile.js",
    // recoveryPassword is injected dynamically by SweetAlert2 html: option — not in profile.html
    optionalIds: ["recoveryPassword"],
  },
  {
    name: "Campaign Detail",
    html: "src/pages/campaign-detail.html",
    js: "src/scripts/campaign-detail.js",
    // editCampaignForm is accessed with ?. — safe if absent
    optionalIds: [],
  },
  {
    name: "Create Campaign",
    html: "src/pages/create-campaign.html",
    js: "src/scripts/create-campaign.js",
    // requirementsChecklist is created dynamically by JS if absent — safe pattern
    optionalIds: ["requirementsChecklist"],
  },
  {
    name: "Admin",
    html: "src/pages/admin.html",
    js: "src/scripts/admin.js",
    optionalIds: [],
  },
];

/**
 * Extract all id="X" values from an HTML string.
 */
function extractHtmlIds(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * Extract all getElementById("X") argument values from a JS string.
 * Returns unique IDs only.
 */
function extractGetElementByIdCalls(js) {
  const ids = [...js.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(
    (m) => m[1]
  );
  return [...new Set(ids)];
}

describe("DOM Integrity — getElementById vs HTML ids", () => {
  for (const { name, html: htmlPath, js: jsPath, optionalIds } of pages) {
    it(`${name}: every getElementById call has a matching id in HTML`, () => {
      const htmlContent = readFileSync(resolve(ROOT, htmlPath), "utf-8");
      const jsContent = readFileSync(resolve(ROOT, jsPath), "utf-8");

      const htmlIds = extractHtmlIds(htmlContent);
      const jsCalls = extractGetElementByIdCalls(jsContent);

      const missing = jsCalls.filter(
        (id) => !htmlIds.has(id) && !optionalIds.includes(id)
      );

      if (missing.length > 0) {
        console.error(
          `\n[${name}] JS calls getElementById() for IDs missing from HTML:`
        );
        missing.forEach((id) => console.error(`  ✗ id="${id}"`));
        console.error(
          `\n  Fix: add these elements to ${htmlPath},`
        );
        console.error(
          `       OR add their ids to the optionalIds list in dom-integrity.test.js\n`
        );
      }

      expect(missing).toEqual([]);
    });
  }
});
