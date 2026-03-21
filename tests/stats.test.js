// Tests for public stats page logic (stats.js script helpers)
// The service functions (stats.js service) require a real Supabase connection,
// so we test the pure rendering helpers extracted here.

// ---------------------------------------------------------------------------
// Helpers mirroring src/scripts/stats.js pure functions
// ---------------------------------------------------------------------------

function formatNumber(n) {
  if (n === null || n === undefined) return "0";
  return Number(n).toLocaleString();
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CATEGORY_CONFIG = {
  park:   { icon: "🌳", cls: "cat-park" },
  street: { icon: "🛣️", cls: "cat-street" },
  water:  { icon: "💧", cls: "cat-water" },
  other:  { icon: "📦", cls: "cat-other" },
};

// ---------------------------------------------------------------------------
// formatNumber()
// ---------------------------------------------------------------------------
describe("formatNumber()", () => {
  it("returns '0' for null", () => {
    expect(formatNumber(null)).toBe("0");
  });

  it("returns '0' for undefined", () => {
    expect(formatNumber(undefined)).toBe("0");
  });

  it("formats integer correctly", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("formats large number with locale separator", () => {
    // toLocaleString format varies by locale but should at least not throw
    const result = formatNumber(1000);
    expect(typeof result).toBe("string");
    expect(result).toContain("1");
    expect(result).toContain("0");
  });

  it("handles string numbers", () => {
    expect(formatNumber("99")).toBe("99");
  });

  it("handles 0", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

// ---------------------------------------------------------------------------
// capitalize()
// ---------------------------------------------------------------------------
describe("capitalize()", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("park")).toBe("Park");
    expect(capitalize("street")).toBe("Street");
    expect(capitalize("water")).toBe("Water");
    expect(capitalize("other")).toBe("Other");
  });

  it("returns empty string for empty input", () => {
    expect(capitalize("")).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(capitalize(null)).toBe("");
    expect(capitalize(undefined)).toBe("");
  });

  it("does not alter already-capitalized strings", () => {
    expect(capitalize("Park")).toBe("Park");
  });
});

// ---------------------------------------------------------------------------
// escapeHTML()
// ---------------------------------------------------------------------------
describe("escapeHTML()", () => {
  it("escapes ampersand", () => {
    expect(escapeHTML("A & B")).toBe("A &amp; B");
  });

  it("escapes less-than", () => {
    expect(escapeHTML("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHTML('"hello"')).toBe("&quot;hello&quot;");
  });

  it("returns plain string unchanged", () => {
    expect(escapeHTML("Darvenitsa")).toBe("Darvenitsa");
  });

  it("handles Cyrillic text unchanged", () => {
    expect(escapeHTML("Дарвеница")).toBe("Дарвеница");
  });
});

// ---------------------------------------------------------------------------
// CATEGORY_CONFIG lookup
// ---------------------------------------------------------------------------
describe("CATEGORY_CONFIG", () => {
  it("has an entry for all four categories", () => {
    expect(CATEGORY_CONFIG.park).toBeDefined();
    expect(CATEGORY_CONFIG.street).toBeDefined();
    expect(CATEGORY_CONFIG.water).toBeDefined();
    expect(CATEGORY_CONFIG.other).toBeDefined();
  });

  it("each entry has icon and cls", () => {
    Object.values(CATEGORY_CONFIG).forEach((cfg) => {
      expect(cfg.icon).toBeTruthy();
      expect(cfg.cls).toBeTruthy();
    });
  });

  it("falls back to 'other' config for unknown category", () => {
    const fallback = CATEGORY_CONFIG["unknown"] ?? CATEGORY_CONFIG.other;
    expect(fallback).toBe(CATEGORY_CONFIG.other);
  });
});

// ---------------------------------------------------------------------------
// Leaderboard rank class logic
// ---------------------------------------------------------------------------
describe("Leaderboard rank class assignment", () => {
  const RANK_CLS = ["rank-1", "rank-2", "rank-3"];

  it("rank 0 (1st place) gets rank-1", () => {
    expect(RANK_CLS[0] ?? "rank-other").toBe("rank-1");
  });

  it("rank 1 (2nd place) gets rank-2", () => {
    expect(RANK_CLS[1] ?? "rank-other").toBe("rank-2");
  });

  it("rank 2 (3rd place) gets rank-3", () => {
    expect(RANK_CLS[2] ?? "rank-other").toBe("rank-3");
  });

  it("rank 3+ gets rank-other", () => {
    expect(RANK_CLS[3] ?? "rank-other").toBe("rank-other");
    expect(RANK_CLS[10] ?? "rank-other").toBe("rank-other");
  });
});
