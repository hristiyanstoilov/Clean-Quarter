import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadI18n(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function deepGet(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Mirrors the pagination logic from admin.js
const PENDING_PAGE_SIZE = 10;

function paginate(items, currentPage) {
  const totalPages = Math.ceil(items.length / PENDING_PAGE_SIZE);
  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const start = (safePage - 1) * PENDING_PAGE_SIZE;
  return {
    pageItems: items.slice(start, start + PENDING_PAGE_SIZE),
    totalPages,
    safePage,
    start,
  };
}

function makeItems(n) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
}

// ─── i18n completeness ────────────────────────────────────────────────────────

const I18N_FILES = [
  "src/i18n/bg.json",
  "src/i18n/en.json",
  "public/i18n/bg.json",
  "public/i18n/en.json",
];

describe("Admin pagination — i18n keys", () => {
  for (const file of I18N_FILES) {
    describe(file, () => {
      let t;
      beforeEach(() => { t = loadI18n(file); });

      it("has admin.showingOf", () => {
        expect(deepGet(t, "admin.showingOf")).toBeTruthy();
      });

      it("admin.showingOf contains {from}, {to}, {total}", () => {
        const v = deepGet(t, "admin.showingOf");
        expect(v).toContain("{from}");
        expect(v).toContain("{to}");
        expect(v).toContain("{total}");
      });

      it("has admin.prev", () => {
        expect(deepGet(t, "admin.prev")).toBeTruthy();
      });

      it("has admin.next", () => {
        expect(deepGet(t, "admin.next")).toBeTruthy();
      });
    });
  }
});

// ─── pagination logic ─────────────────────────────────────────────────────────

describe("Admin pagination — page logic", () => {
  it("0 items → 0 total pages, empty slice", () => {
    const { pageItems, totalPages } = paginate([], 1);
    expect(pageItems).toHaveLength(0);
    expect(totalPages).toBe(0);
  });

  it("5 items → 1 page, all items shown", () => {
    const { pageItems, totalPages } = paginate(makeItems(5), 1);
    expect(pageItems).toHaveLength(5);
    expect(totalPages).toBe(1);
  });

  it("10 items → exactly 1 page", () => {
    const { pageItems, totalPages } = paginate(makeItems(10), 1);
    expect(pageItems).toHaveLength(10);
    expect(totalPages).toBe(1);
  });

  it("11 items → 2 pages", () => {
    const { totalPages } = paginate(makeItems(11), 1);
    expect(totalPages).toBe(2);
  });

  it("page 1 of 25 items → items 1–10", () => {
    const { pageItems, start } = paginate(makeItems(25), 1);
    expect(start).toBe(0);
    expect(pageItems).toHaveLength(10);
    expect(pageItems[0].id).toBe(1);
    expect(pageItems[9].id).toBe(10);
  });

  it("page 2 of 25 items → items 11–20", () => {
    const { pageItems, start } = paginate(makeItems(25), 2);
    expect(start).toBe(10);
    expect(pageItems).toHaveLength(10);
    expect(pageItems[0].id).toBe(11);
    expect(pageItems[9].id).toBe(20);
  });

  it("last page of 25 items → 5 items", () => {
    const { pageItems } = paginate(makeItems(25), 3);
    expect(pageItems).toHaveLength(5);
    expect(pageItems[0].id).toBe(21);
  });

  it("page beyond total is clamped to last page", () => {
    const { safePage } = paginate(makeItems(5), 99);
    expect(safePage).toBe(1);
  });

  it("page 0 is clamped to 1", () => {
    const { safePage } = paginate(makeItems(15), 0);
    expect(safePage).toBe(1);
  });

  it("exactly 20 items → 2 full pages", () => {
    const p1 = paginate(makeItems(20), 1);
    const p2 = paginate(makeItems(20), 2);
    expect(p1.pageItems).toHaveLength(10);
    expect(p2.pageItems).toHaveLength(10);
    expect(p1.totalPages).toBe(2);
  });
});

// ─── showingOf interpolation ──────────────────────────────────────────────────

describe("Admin pagination — showingOf interpolation", () => {
  const interpolate = (template, from, to, total) =>
    template.replace("{from}", from).replace("{to}", to).replace("{total}", total);

  it("page 1 of 25 → Показани 1–10 от 25", () => {
    const bg = loadI18n("src/i18n/bg.json");
    const tpl = deepGet(bg, "admin.showingOf");
    expect(interpolate(tpl, 1, 10, 25)).toContain("1");
    expect(interpolate(tpl, 1, 10, 25)).toContain("10");
    expect(interpolate(tpl, 1, 10, 25)).toContain("25");
  });

  it("last page → shows correct end index", () => {
    const en = loadI18n("src/i18n/en.json");
    const tpl = deepGet(en, "admin.showingOf");
    expect(interpolate(tpl, 21, 25, 25)).toContain("21");
    expect(interpolate(tpl, 21, 25, 25)).toContain("25");
  });
});

// ─── named window functions ────────────────────────────────────────────────────

describe("Admin pagination — named window functions", () => {
  const adminSrc = readFileSync("src/scripts/admin.js", "utf-8");

  it("exposes pendingPrevPage as a window function", () => {
    expect(adminSrc).toContain("window.pendingPrevPage");
  });

  it("exposes pendingNextPage as a window function", () => {
    expect(adminSrc).toContain("window.pendingNextPage");
  });

  it("onclick uses pendingPrevPage() not inline logic", () => {
    expect(adminSrc).toContain('onclick="pendingPrevPage()"');
    expect(adminSrc).not.toContain("pendingCurrentPage--; renderPendingTable()");
  });

  it("onclick uses pendingNextPage() not inline logic", () => {
    expect(adminSrc).toContain('onclick="pendingNextPage()"');
    expect(adminSrc).not.toContain("pendingCurrentPage++; renderPendingTable()");
  });
});
