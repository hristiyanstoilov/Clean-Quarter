/**
 * HIBP Utility Tests — static source analysis + unit tests with fetch mock
 *
 * Tests:
 *  - Source exports the correct functions
 *  - k-anonymity: only the 5-char prefix is sent, never the full hash
 *  - isPasswordPwned returns true when suffix found in API response
 *  - isPasswordPwned returns false when suffix not found
 *  - getPwnedCount returns the correct count
 *  - Fail-open: returns 0 / false on network error (never blocks user)
 *  - Fail-open: returns 0 / false on non-OK HTTP response
 *  - i18n key "auth.passwordBreached" present in all 4 JSON files
 *  - auth-validation.js imports hibp.js
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ROOT = resolve(process.cwd());

// ── Static source checks ──────────────────────────────────────────────────────

const hibpSrc = readFileSync(resolve(ROOT, "src/utils/hibp.js"), "utf-8");

describe("hibp.js — exports", () => {
  it("exports getPwnedCount", () => {
    expect(hibpSrc).toContain("export async function getPwnedCount");
  });

  it("exports isPasswordPwned", () => {
    expect(hibpSrc).toContain("export async function isPasswordPwned");
  });
});

describe("hibp.js — k-anonymity implementation", () => {
  it("sends only 5-char prefix to HIBP API", () => {
    expect(hibpSrc).toContain("hash.slice(0, 5)");
    expect(hibpSrc).toContain("hash.slice(5)");
  });

  it("uses pwnedpasswords.com range endpoint", () => {
    expect(hibpSrc).toContain("api.pwnedpasswords.com/range/");
  });

  it("uses SHA-1 for hashing", () => {
    expect(hibpSrc).toContain('digest("SHA-1"');
  });

  it("uses crypto.subtle (Web Crypto API)", () => {
    expect(hibpSrc).toContain("crypto.subtle.digest");
  });

  it("fetch call uses prefix variable, not the password directly", () => {
    // The fetch URL is built from `prefix` (5 hex chars), never from `password`
    expect(hibpSrc).toContain("/range/${prefix}");
    // No direct string interpolation of `password` or `str` into the fetch URL
    expect(hibpSrc).not.toMatch(/\/range\/\$\{(password|str)\}/);
  });

  it("adds Add-Padding header to prevent traffic analysis", () => {
    expect(hibpSrc).toContain('"Add-Padding": "true"');
  });
});

describe("hibp.js — fail-open behaviour", () => {
  it("returns 0 on network error (catch block)", () => {
    expect(hibpSrc).toContain("return 0;");
  });

  it("returns 0 on non-OK HTTP response", () => {
    expect(hibpSrc).toContain("if (!res.ok) return 0;");
  });

  it("isPasswordPwned returns false when count is 0", () => {
    expect(hibpSrc).toContain("> 0");
  });
});

// ── Unit tests with fetch mock ────────────────────────────────────────────────

describe("isPasswordPwned — unit tests", () => {
  // "password" → SHA-1 → 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8
  // prefix = 5BAA6, suffix = 1E4C9B93F3F0682250B6CF8331B7EE68FD8
  const KNOWN_PWNED_PREFIX = "5BAA6";
  const KNOWN_PWNED_SUFFIX = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when suffix is in HIBP response", async () => {
    fetch.mockResolvedValue({
      ok: true,
      text: async () =>
        `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1\r\n${KNOWN_PWNED_SUFFIX}:3861493\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:5`,
    });

    const { isPasswordPwned } = await import("../src/utils/hibp.js");
    const result = await isPasswordPwned("password");
    expect(result).toBe(true);
  });

  it("returns false when suffix is not in HIBP response", async () => {
    fetch.mockResolvedValue({
      ok: true,
      text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:5",
    });

    const { isPasswordPwned } = await import("../src/utils/hibp.js");
    const result = await isPasswordPwned("password");
    expect(result).toBe(false);
  });

  it("returns false on network error (fail-open)", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    const { isPasswordPwned } = await import("../src/utils/hibp.js");
    const result = await isPasswordPwned("password");
    expect(result).toBe(false);
  });

  it("returns false on non-200 HTTP status (fail-open)", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503 });

    const { isPasswordPwned } = await import("../src/utils/hibp.js");
    const result = await isPasswordPwned("password");
    expect(result).toBe(false);
  });

  it("getPwnedCount returns the correct breach count", async () => {
    fetch.mockResolvedValue({
      ok: true,
      text: async () => `${KNOWN_PWNED_SUFFIX}:3861493`,
    });

    const { getPwnedCount } = await import("../src/utils/hibp.js");
    const count = await getPwnedCount("password");
    expect(count).toBe(3861493);
  });

  it("fetch is called with the correct prefix URL", async () => {
    fetch.mockResolvedValue({ ok: true, text: async () => "" });

    const { getPwnedCount } = await import("../src/utils/hibp.js");
    await getPwnedCount("password");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/range/${KNOWN_PWNED_PREFIX}`),
      expect.any(Object)
    );
  });
});

// ── i18n keys ─────────────────────────────────────────────────────────────────

describe("HIBP — i18n key auth.passwordBreached in all 4 files", () => {
  const i18nFiles = [
    { lang: "BG (src)", path: "src/i18n/bg.json" },
    { lang: "EN (src)", path: "src/i18n/en.json" },
    { lang: "BG (public)", path: "public/i18n/bg.json" },
    { lang: "EN (public)", path: "public/i18n/en.json" },
  ];

  i18nFiles.forEach(({ lang, path }) => {
    it(`${lang}: has "passwordBreached" key`, () => {
      const src = readFileSync(resolve(ROOT, path), "utf-8");
      expect(src).toContain('"passwordBreached"');
    });
  });
});

// ── Integration: auth-validation.js imports hibp.js ──────────────────────────

describe("auth-validation.js — HIBP integration", () => {
  const authSrc = readFileSync(resolve(ROOT, "src/scripts/auth-validation.js"), "utf-8");

  it("imports isPasswordPwned from hibp.js", () => {
    expect(authSrc).toContain("isPasswordPwned");
    expect(authSrc).toContain("hibp.js");
  });

  it("calls isPasswordPwned on register submit", () => {
    expect(authSrc).toContain("await isPasswordPwned(");
  });

  it("uses hibpCleared flag to allow second submit", () => {
    expect(authSrc).toContain("hibpCleared");
  });

  it("shows Swal warning when password is breached", () => {
    expect(authSrc).toContain("auth.passwordBreached");
  });

  it("resets hibpCleared on password input change", () => {
    // Ensures a new password value is always re-checked by HIBP
    expect(authSrc).toContain('"input"');
    expect(authSrc).toContain("hibpCleared = false");
  });
});
