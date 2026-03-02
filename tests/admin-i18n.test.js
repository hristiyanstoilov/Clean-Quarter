/**
 * Admin Panel i18n Tests
 *
 * Statically verifies that:
 * 1. All 4 i18n JSON files contain the required admin translation keys.
 * 2. src/ and public/ translations are in sync for the admin section.
 * 3. renderPendingTable() in admin.js uses data-i18n attributes on every
 *    table header instead of hardcoded English strings.
 * 4. Photo fallbacks use t("admin.noPhoto") instead of the old hardcoded "N/A".
 * 5. applyLanguage() is called after setting container.innerHTML so that
 *    dynamically-injected data-i18n attributes are actually translated.
 * 6. Action buttons do NOT carry data-i18n on the <button> element itself
 *    (which would wipe emoji), only on the inner <span>.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(process.cwd());

// Keys added specifically to fix the mixed-language admin table
const REQUIRED_ADMIN_KEYS = ["campaign", "submitted", "beforePhoto", "afterPhoto", "noPhoto"];

const I18N_FILES = [
  { path: "src/i18n/bg.json",     label: "src/i18n/bg.json" },
  { path: "src/i18n/en.json",     label: "src/i18n/en.json" },
  { path: "public/i18n/bg.json",  label: "public/i18n/bg.json" },
  { path: "public/i18n/en.json",  label: "public/i18n/en.json" },
];

// ─── i18n file completeness ──────────────────────────────────────────────────

describe("Admin i18n — required keys present in all translation files", () => {
  for (const { path, label } of I18N_FILES) {
    it(`${label} has all required admin keys`, () => {
      const json = JSON.parse(readFileSync(resolve(ROOT, path), "utf-8"));
      const missing = REQUIRED_ADMIN_KEYS.filter((k) => !json.admin?.[k]);
      expect(missing, `Missing keys in ${label}: ${missing.join(", ")}`).toEqual([]);
    });
  }
});

describe("Admin i18n — src and public translations stay in sync", () => {
  it("bg.json admin section is identical in src/ and public/", () => {
    const src = JSON.parse(readFileSync(resolve(ROOT, "src/i18n/bg.json"), "utf-8"));
    const pub = JSON.parse(readFileSync(resolve(ROOT, "public/i18n/bg.json"), "utf-8"));
    expect(src.admin).toEqual(pub.admin);
  });

  it("en.json admin section is identical in src/ and public/", () => {
    const src = JSON.parse(readFileSync(resolve(ROOT, "src/i18n/en.json"), "utf-8"));
    const pub = JSON.parse(readFileSync(resolve(ROOT, "public/i18n/en.json"), "utf-8"));
    expect(src.admin).toEqual(pub.admin);
  });
});

// ─── admin.js static analysis ────────────────────────────────────────────────

describe("renderPendingTable() in admin.js — static source analysis", () => {
  const adminJs = readFileSync(resolve(ROOT, "src/scripts/admin.js"), "utf-8");

  it("every <th> in the pending table has a data-i18n attribute", () => {
    const expectedKeys = [
      "admin.username",
      "admin.campaign",
      "admin.beforePhoto",
      "admin.afterPhoto",
      "admin.submitted",
      "admin.actions",
    ];
    for (const key of expectedKeys) {
      expect(
        adminJs,
        `Missing data-i18n="${key}" in admin.js table header`
      ).toContain(`data-i18n="${key}"`);
    }
  });

  it('photo fallback uses t("admin.noPhoto") — not a hardcoded "N/A" string', () => {
    // New translated form must be present
    expect(adminJs).toContain('t("admin.noPhoto")');
    // Old ternary pattern `? <img> : "N/A"` must be gone
    // (|| "N/A" for username/email fallbacks is fine and uses || not :)
    expect(adminJs).not.toContain(': "N/A"');
  });

  it("applyLanguage() is called after container.innerHTML = tableHTML", () => {
    const innerHTMLIdx = adminJs.indexOf("container.innerHTML = tableHTML");
    const applyLangIdx = adminJs.indexOf("applyLanguage(", innerHTMLIdx);
    expect(innerHTMLIdx, "container.innerHTML = tableHTML not found").toBeGreaterThan(-1);
    expect(
      applyLangIdx,
      "applyLanguage() must appear after container.innerHTML = tableHTML"
    ).toBeGreaterThan(innerHTMLIdx);
  });

  it("action buttons carry data-i18n only on inner <span>, not on <button>", () => {
    // data-i18n on <button> wipes emoji — must be on <span> only
    expect(adminJs).not.toMatch(/class="btn-approve"[^>]*data-i18n/);
    expect(adminJs).not.toMatch(/class="btn-reject"[^>]*data-i18n/);
    // Inner spans must still carry the attribute
    expect(adminJs).toContain('<span data-i18n="admin.approve">');
    expect(adminJs).toContain('<span data-i18n="admin.reject">');
  });
});
