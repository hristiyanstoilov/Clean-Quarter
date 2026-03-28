/**
 * Neighborhoods Utility Tests
 *
 * Covers:
 *  - Source structure: NEIGHBORHOODS, NEIGHBORHOOD_VALUES, localizeNeighborhood exports
 *  - All 5 DB-canonical values present in source AND in the CHECK CONSTRAINT migration
 *  - localizeNeighborhood: falsy input, unknown value, legacy camelCase fallback
 *  - localizeNeighborhood: correct BG translations for all 5 valid values
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { localizeNeighborhood, NEIGHBORHOODS, NEIGHBORHOOD_VALUES } from "../src/utils/neighborhoods.js";
import { initI18n, setLanguage } from "../src/utils/i18n.js";

const ROOT = resolve(process.cwd());
const src = readFileSync(resolve(ROOT, "src/utils/neighborhoods.js"), "utf-8");
const constraintSql = readFileSync(
  resolve(ROOT, "supabase/migrations/20260328162000_add_neighborhood_check_constraint.sql"),
  "utf-8"
);

// ─── Source structure ─────────────────────────────────────────────────────────

describe("neighborhoods.js — exports", () => {
  it("exports NEIGHBORHOODS array", () => {
    expect(src).toContain("export const NEIGHBORHOODS");
  });

  it("exports NEIGHBORHOOD_VALUES array", () => {
    expect(src).toContain("export const NEIGHBORHOOD_VALUES");
  });

  it("exports localizeNeighborhood function", () => {
    expect(src).toContain("export function localizeNeighborhood");
  });

  it("NEIGHBORHOOD_VALUES is derived from NEIGHBORHOODS (no duplication)", () => {
    expect(src).toContain("NEIGHBORHOODS.map((n) => n.value)");
  });
});

describe("neighborhoods.js — NEIGHBORHOODS array", () => {
  it("has exactly 5 entries", () => {
    expect(NEIGHBORHOODS).toHaveLength(5);
  });

  it("every entry has a value and an i18nKey", () => {
    NEIGHBORHOODS.forEach(({ value, i18nKey }) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      expect(typeof i18nKey).toBe("string");
      expect(i18nKey.length).toBeGreaterThan(0);
    });
  });

  it("NEIGHBORHOOD_VALUES has 5 strings", () => {
    expect(NEIGHBORHOOD_VALUES).toHaveLength(5);
    NEIGHBORHOOD_VALUES.forEach((v) => expect(typeof v).toBe("string"));
  });
});

// ─── DB constraint alignment ──────────────────────────────────────────────────

const CANONICAL_VALUES = [
  "Studentski Grad",
  "Darvenitsa",
  "Musagenitsa",
  "Vitosha (VEC)",
  "Malinova Dolina",
];

describe("neighborhoods.js — canonical DB values", () => {
  CANONICAL_VALUES.forEach((v) => {
    it(`source contains DB value "${v}"`, () => {
      expect(src).toContain(`"${v}"`);
    });

    it(`CHECK CONSTRAINT migration contains "${v}"`, () => {
      expect(constraintSql).toContain(`'${v}'`);
    });
  });

  it("NEIGHBORHOOD_VALUES matches canonical list", () => {
    expect(NEIGHBORHOOD_VALUES.sort()).toEqual([...CANONICAL_VALUES].sort());
  });
});

describe("neighborhoods.js — i18nKey mapping", () => {
  const EXPECTED_KEYS = ["studentskiGrad", "darvenitsa", "musagenitsa", "vitoshaVec", "malinovaDolina"];

  it("all expected i18n keys are defined", () => {
    const actualKeys = NEIGHBORHOODS.map((n) => n.i18nKey);
    expect(actualKeys.sort()).toEqual([...EXPECTED_KEYS].sort());
  });
});

// ─── localizeNeighborhood — fallback behavior ─────────────────────────────────

describe("localizeNeighborhood — falsy input", () => {
  it("returns empty string for null", () => {
    expect(localizeNeighborhood(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(localizeNeighborhood(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(localizeNeighborhood("")).toBe("");
  });
});

describe("localizeNeighborhood — unknown / legacy values", () => {
  it("returns the raw value for an unknown neighborhood", () => {
    expect(localizeNeighborhood("Unknown Quarter")).toBe("Unknown Quarter");
  });

  it("returns raw camelCase for legacy 'darvenitsa' (not in NEIGHBORHOODS map)", () => {
    // After DB normalization these values should not exist, but localizeNeighborhood
    // must not crash — it should return the raw value as-is.
    expect(localizeNeighborhood("darvenitsa")).toBe("darvenitsa");
  });

  it("returns raw camelCase for legacy 'studentskiGrad'", () => {
    expect(localizeNeighborhood("studentskiGrad")).toBe("studentskiGrad");
  });

  // BUG: t() returns the i18n key itself (truthy) when translations are not loaded.
  // "|| raw" is never reached for valid DB values → user sees "neighborhoods.darvenitsa"
  // instead of the raw "Darvenitsa". Fix: check translated !== i18nKeyPath.
  it("returns raw DB value (not i18n key) for valid neighborhood when i18n not loaded", () => {
    expect(localizeNeighborhood("Darvenitsa")).toBe("Darvenitsa");
    expect(localizeNeighborhood("Studentski Grad")).toBe("Studentski Grad");
    expect(localizeNeighborhood("Vitosha (VEC)")).toBe("Vitosha (VEC)");
  });
});

// ─── localizeNeighborhood — translation (integration) ────────────────────────

describe("localizeNeighborhood — Bulgarian translations", () => {
  beforeAll(async () => {
    const bgJson = JSON.parse(readFileSync(resolve(ROOT, "public/i18n/bg.json"), "utf-8"));
    const enJson = JSON.parse(readFileSync(resolve(ROOT, "public/i18n/en.json"), "utf-8"));
    global.fetch = async (url) => ({
      json: async () => (url.includes("bg.json") ? bgJson : enJson),
    });
    await initI18n(false, true);
    setLanguage("bg", true);
  });

  it("localizes Darvenitsa → Дървеница", () => {
    expect(localizeNeighborhood("Darvenitsa")).toBe("Дървеница");
  });

  it("localizes Studentski Grad → Студентски град", () => {
    expect(localizeNeighborhood("Studentski Grad")).toBe("Студентски град");
  });

  it("localizes Musagenitsa → Мусагеница", () => {
    expect(localizeNeighborhood("Musagenitsa")).toBe("Мусагеница");
  });

  it("localizes Vitosha (VEC) → Витоша (ВЕЦ)", () => {
    expect(localizeNeighborhood("Vitosha (VEC)")).toBe("Витоша (ВЕЦ)");
  });

  it("localizes Malinova Dolina → Малинова долина", () => {
    expect(localizeNeighborhood("Malinova Dolina")).toBe("Малинова долина");
  });
});
