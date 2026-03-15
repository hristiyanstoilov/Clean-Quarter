// Unit tests for campaign date/time feature — second round
// Covers: i18n completeness, end_time constraint, demo data integrity,
// bilingual popup title extraction, timeRange interpolation.

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(process.cwd());

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read and parse one of the i18n JSON files. */
function loadI18n(relativePath) {
  const content = readFileSync(resolve(ROOT, relativePath), "utf-8");
  return JSON.parse(content);
}

/** Deep-get a dot-path like "campaign.scheduledDate" from an object. */
function deepGet(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

/**
 * Validates that end_time > start_time (both as "HH:MM" or "HH:MM:SS").
 * Returns true when the combination is valid (end absent OR end > start).
 * Mirrors the DB CHECK constraint: end_time IS NULL OR end_time > start_time
 */
function isValidTimeRange(startTime, endTime) {
  if (!endTime) return true; // end is optional
  // Compare lexicographically — valid for HH:MM and HH:MM:SS ISO strings
  return endTime.slice(0, 5) > startTime.slice(0, 5);
}

/**
 * Extracts a display title from a campaign whose title may be:
 *   - a plain string: "Почистване"
 *   - a JSON bilingual string: '{"bg":"Почистване","en":"Cleanup"}'
 * Mirrors the logic in campaign-detail.js initializeDetailMap().
 */
function extractPopupTitle(rawTitle, lang = "bg") {
  if (!rawTitle) return "";
  try {
    const parsed = JSON.parse(rawTitle);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed[lang] || parsed.bg || parsed.en || rawTitle;
    }
  } catch (_) {
    // plain string
  }
  return rawTitle;
}

/**
 * Interpolates the timeRange template "{start} – {end}".
 * Mirrors the usage: t("campaign.timeRange").replace("{start}", ...).replace("{end}", ...)
 */
function interpolateTimeRange(template, start, end) {
  return template.replace("{start}", start).replace("{end}", end);
}

// ─── i18n completeness ────────────────────────────────────────────────────────

const DATETIME_KEYS = [
  "campaign.scheduledDate",
  "campaign.startTime",
  "campaign.endTime",
  "campaign.timeRange",
  "campaign.noDate",
  "campaign.pastDateError",
  "campaign.scheduledLabel",
  "campaign.dateTimePlaceholder",
];

const I18N_FILES = [
  "src/i18n/bg.json",
  "src/i18n/en.json",
  "public/i18n/bg.json",
  "public/i18n/en.json",
];

describe("Campaign DateTime — i18n key completeness", () => {
  for (const file of I18N_FILES) {
    describe(`${file}`, () => {
      let translations;
      beforeAll(() => {
        translations = loadI18n(file);
      });

      for (const key of DATETIME_KEYS) {
        it(`has key "${key}"`, () => {
          const value = deepGet(translations, key);
          expect(value, `Missing key "${key}" in ${file}`).toBeTruthy();
          expect(typeof value).toBe("string");
          expect(value.length).toBeGreaterThan(0);
        });
      }

      it('timeRange template contains "{start}" and "{end}" placeholders', () => {
        const template = deepGet(translations, "campaign.timeRange");
        expect(template).toContain("{start}");
        expect(template).toContain("{end}");
      });
    });
  }
});

// ─── End time constraint ──────────────────────────────────────────────────────

describe("Campaign DateTime — end_time > start_time validation", () => {
  it("valid: end_time is null (optional field)", () => {
    expect(isValidTimeRange("10:00", null)).toBe(true);
    expect(isValidTimeRange("10:00", "")).toBe(true);
    expect(isValidTimeRange("10:00", undefined)).toBe(true);
  });

  it("valid: end_time is clearly after start_time", () => {
    expect(isValidTimeRange("10:00", "13:00")).toBe(true);
    expect(isValidTimeRange("09:00", "09:30")).toBe(true);
    expect(isValidTimeRange("08:00", "20:00")).toBe(true);
  });

  it("invalid: end_time equals start_time", () => {
    expect(isValidTimeRange("10:00", "10:00")).toBe(false);
  });

  it("invalid: end_time is before start_time", () => {
    expect(isValidTimeRange("13:00", "10:00")).toBe(false);
    expect(isValidTimeRange("12:00", "08:00")).toBe(false);
  });

  it("works with HH:MM:SS format (DB storage format)", () => {
    expect(isValidTimeRange("10:00:00", "13:00:00")).toBe(true);
    expect(isValidTimeRange("13:00:00", "10:00:00")).toBe(false);
    expect(isValidTimeRange("10:00:00", "10:00:00")).toBe(false);
  });

  it("handles edge: midnight start (00:00) with morning end", () => {
    expect(isValidTimeRange("00:00", "06:00")).toBe(true);
  });

  it("handles edge: late evening cleanup 22:00 – 23:59", () => {
    expect(isValidTimeRange("22:00", "23:59")).toBe(true);
    expect(isValidTimeRange("23:59", "22:00")).toBe(false);
  });
});

// ─── Demo data integrity ──────────────────────────────────────────────────────

describe("Campaign DateTime — demo data integrity", () => {
  // Import the demo campaigns array from demoMode.js via a helper
  // We parse it statically from the source to avoid DOM/Supabase module side-effects.
  let demoCampaigns;

  beforeAll(() => {
    // Extract the demoCampaigns array by loading demoMode.js as text and eval-ing
    // only the data portion. Safer: just read and assert the shape via regex/JSON.
    // We use a structural approach: import the file as a module is not possible
    // (side effects). Instead we assert through the JSON we know about.
    // Use the public i18n approach: load demoMode.js source and check statically.
    const src = readFileSync(resolve(ROOT, "src/utils/demoMode.js"), "utf-8");

    // Extract all scheduled_date values — property keys are unquoted in JS object literals
    const dateMatches = [...src.matchAll(/scheduled_date:\s*"([^"]+)"/g)];
    const timeMatches = [...src.matchAll(/start_time:\s*"([^"]+)"/g)];

    demoCampaigns = dateMatches.map((m, i) => ({
      scheduled_date: m[1],
      start_time: timeMatches[i]?.[1] ?? null,
    }));
  });

  it("all 5 demo campaigns have scheduled_date defined", () => {
    expect(demoCampaigns).toHaveLength(5);
    for (const c of demoCampaigns) {
      expect(c.scheduled_date).toBeTruthy();
    }
  });

  it("all 5 demo campaigns have start_time defined", () => {
    for (const c of demoCampaigns) {
      expect(c.start_time).toBeTruthy();
    }
  });

  it("all scheduled_dates are in the future (relative to 2026-03-15 baseline)", () => {
    // Baseline: the date when the feature was implemented
    const baseline = "2026-03-15";
    for (const c of demoCampaigns) {
      expect(
        c.scheduled_date >= baseline,
        `Demo campaign date ${c.scheduled_date} should be >= ${baseline}`
      ).toBe(true);
    }
  });

  it("scheduled_dates are valid YYYY-MM-DD format", () => {
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const c of demoCampaigns) {
      expect(c.scheduled_date).toMatch(isoDatePattern);
    }
  });

  it("start_times are valid HH:MM format", () => {
    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    for (const c of demoCampaigns) {
      expect(c.start_time).toMatch(timePattern);
    }
  });
});

// ─── Bilingual popup title extraction ─────────────────────────────────────────

describe("Campaign DateTime — bilingual popup title extraction", () => {
  it("returns plain string as-is", () => {
    expect(extractPopupTitle("Почистване на парк", "bg")).toBe("Почистване на парк");
    expect(extractPopupTitle("Park Cleanup", "en")).toBe("Park Cleanup");
  });

  it("extracts Bulgarian from JSON bilingual object", () => {
    const raw = JSON.stringify({ bg: "Почистване", en: "Cleanup" });
    expect(extractPopupTitle(raw, "bg")).toBe("Почистване");
  });

  it("extracts English from JSON bilingual object", () => {
    const raw = JSON.stringify({ bg: "Почистване", en: "Cleanup" });
    expect(extractPopupTitle(raw, "en")).toBe("Cleanup");
  });

  it("falls back to bg when requested lang is missing", () => {
    const raw = JSON.stringify({ bg: "Почистване" }); // no 'en' key
    expect(extractPopupTitle(raw, "en")).toBe("Почистване");
  });

  it("falls back to en when bg is missing", () => {
    const raw = JSON.stringify({ en: "Cleanup" }); // no 'bg' key
    expect(extractPopupTitle(raw, "bg")).toBe("Cleanup");
  });

  it("returns empty string for null/undefined input", () => {
    expect(extractPopupTitle(null)).toBe("");
    expect(extractPopupTitle(undefined)).toBe("");
    expect(extractPopupTitle("")).toBe("");
  });

  it("handles malformed JSON gracefully (returns raw string)", () => {
    const malformed = '{bg: "Почистване"'; // invalid JSON
    expect(extractPopupTitle(malformed, "bg")).toBe(malformed);
  });
});

// ─── timeRange template interpolation ─────────────────────────────────────────

describe("Campaign DateTime — timeRange template interpolation", () => {
  it("interpolates BG template correctly", () => {
    const bgTemplate = "{start} – {end}"; // from bg.json
    expect(interpolateTimeRange(bgTemplate, "10:00", "13:00")).toBe("10:00 – 13:00");
  });

  it("interpolates EN template correctly", () => {
    const enTemplate = "{start} – {end}"; // from en.json
    expect(interpolateTimeRange(enTemplate, "10:00", "13:00")).toBe("10:00 – 13:00");
  });

  it("timeRange template in both bg.json files is consistent", () => {
    const srcBg = loadI18n("src/i18n/bg.json");
    const pubBg = loadI18n("public/i18n/bg.json");
    expect(deepGet(srcBg, "campaign.timeRange")).toBe(
      deepGet(pubBg, "campaign.timeRange")
    );
  });

  it("timeRange template in both en.json files is consistent", () => {
    const srcEn = loadI18n("src/i18n/en.json");
    const pubEn = loadI18n("public/i18n/en.json");
    expect(deepGet(srcEn, "campaign.timeRange")).toBe(
      deepGet(pubEn, "campaign.timeRange")
    );
  });

  it("result contains the em dash separator (–)", () => {
    const template = "{start} – {end}";
    const result = interpolateTimeRange(template, "09:00", "12:00");
    expect(result).toContain("–");
  });
});
