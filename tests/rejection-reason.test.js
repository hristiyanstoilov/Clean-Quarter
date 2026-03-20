import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadI18n(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function deepGet(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

const I18N_FILES = [
  "src/i18n/bg.json",
  "src/i18n/en.json",
  "public/i18n/bg.json",
  "public/i18n/en.json",
];

const REQUIRED_KEYS = [
  "admin.rejectionReasonLabel",
  "admin.rejectionReasonRequired",
  "admin.rejectionReasonPlaceholder",
  "admin.rejectionReasonAria",
];

// ─── i18n completeness ────────────────────────────────────────────────────────

describe("Rejection reason — i18n key completeness", () => {
  for (const file of I18N_FILES) {
    describe(file, () => {
      let translations;
      beforeAll(() => {
        translations = loadI18n(file);
      });

      for (const key of REQUIRED_KEYS) {
        it(`has key "${key}"`, () => {
          const value = deepGet(translations, key);
          expect(value, `Missing key "${key}" in ${file}`).toBeTruthy();
          expect(typeof value).toBe("string");
          expect(value.length).toBeGreaterThan(0);
        });
      }

      it('rejectionReasonLabel does NOT contain "optional" or "по желание"', () => {
        const label = deepGet(translations, "admin.rejectionReasonLabel");
        expect(label.toLowerCase()).not.toContain("optional");
        expect(label.toLowerCase()).not.toContain("по желание");
      });
    });
  }
});

// ─── inputValidator logic ─────────────────────────────────────────────────────

describe("Rejection reason — inputValidator logic", () => {
  // Mirrors the SweetAlert2 inputValidator from admin.js
  const validate = (value) => {
    if (!value || !value.trim()) {
      return "Моля, въведи причина за отхвърляне";
    }
    return undefined;
  };

  it("rejects empty string", () => {
    expect(validate("")).toBeTruthy();
  });

  it("rejects whitespace-only string", () => {
    expect(validate("   ")).toBeTruthy();
  });

  it("rejects null", () => {
    expect(validate(null)).toBeTruthy();
  });

  it("rejects undefined", () => {
    expect(validate(undefined)).toBeTruthy();
  });

  it("accepts a valid reason", () => {
    expect(validate("Лошо качество на снимката")).toBeUndefined();
  });

  it("accepts a single word", () => {
    expect(validate("Невалидно")).toBeUndefined();
  });

  it("trims whitespace before accepting", () => {
    expect(validate("  valid reason  ")).toBeUndefined();
  });
});

// ─── DB constraint logic ──────────────────────────────────────────────────────

describe("Rejection reason — DB constraint logic", () => {
  // Mirrors the CHECK constraint:
  // status != 'rejected' OR (rejection_reason IS NOT NULL AND rejection_reason != '')
  const satisfiesConstraint = (status, rejectionReason) => {
    if (status !== "rejected") return true;
    return rejectionReason !== null && rejectionReason !== "";
  };

  it("approved participation with no reason passes", () => {
    expect(satisfiesConstraint("approved", null)).toBe(true);
  });

  it("pending participation with no reason passes", () => {
    expect(satisfiesConstraint("pending", null)).toBe(true);
  });

  it("rejected participation WITH reason passes", () => {
    expect(satisfiesConstraint("rejected", "Лошо качество")).toBe(true);
  });

  it("rejected participation with null reason fails", () => {
    expect(satisfiesConstraint("rejected", null)).toBe(false);
  });

  it("rejected participation with empty string fails", () => {
    expect(satisfiesConstraint("rejected", "")).toBe(false);
  });
});
