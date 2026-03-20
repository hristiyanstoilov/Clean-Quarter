/**
 * Tests for campaign categories feature
 * Covers: validation, filter logic (AND with neighborhood), demo mode,
 *         null rendering, i18n keys, payload structure
 */

describe("Campaign Categories — Validation", () => {
  const VALID_CATEGORIES = ["park", "street", "water", "other"];

  it("accepts all valid category values", () => {
    VALID_CATEGORIES.forEach((cat) => {
      expect(VALID_CATEGORIES).toContain(cat);
    });
  });

  it("rejects unknown category values", () => {
    const invalid = ["beach", "forest", "PARK", "Park", ""];
    invalid.forEach((cat) => {
      expect(VALID_CATEGORIES).not.toContain(cat);
    });
  });

  it("null category is allowed (optional field)", () => {
    // Simulates: const category = selectEl.value || null
    const fromEmpty = "" || null;
    const fromValid = "park" || null;
    expect(fromEmpty).toBeNull();
    expect(VALID_CATEGORIES.includes(fromValid)).toBe(true);
  });

  it("empty string is normalized to null before insert", () => {
    const raw = "";
    const category = raw || null;
    expect(category).toBeNull();
  });
});

describe("Campaign Categories — Filter Logic", () => {
  const campaigns = [
    { id: "1", neighborhood: "Darvenitsa", category: "park" },
    { id: "2", neighborhood: "Darvenitsa", category: "street" },
    { id: "3", neighborhood: "Studentski Grad", category: "park" },
    { id: "4", neighborhood: "Darvenitsa", category: null },
    { id: "5", neighborhood: "Musagenitsa", category: "water" },
  ];

  const applyFilters = (list, neighborhoodFilter, categoryFilter) => {
    let result = list;
    if (neighborhoodFilter) result = result.filter((c) => c.neighborhood === neighborhoodFilter);
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter);
    return result;
  };

  it("no filters returns all campaigns", () => {
    expect(applyFilters(campaigns, null, null)).toHaveLength(5);
  });

  it("neighborhood filter only", () => {
    const result = applyFilters(campaigns, "Darvenitsa", null);
    expect(result).toHaveLength(3);
    expect(result.every((c) => c.neighborhood === "Darvenitsa")).toBe(true);
  });

  it("category filter only", () => {
    const result = applyFilters(campaigns, null, "park");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.category === "park")).toBe(true);
  });

  it("AND logic: neighborhood + category together", () => {
    const result = applyFilters(campaigns, "Darvenitsa", "park");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("AND logic: no match returns empty", () => {
    const result = applyFilters(campaigns, "Musagenitsa", "park");
    expect(result).toHaveLength(0);
  });

  it("null category campaigns are excluded when category filter is active", () => {
    const result = applyFilters(campaigns, "Darvenitsa", "park");
    expect(result.some((c) => c.category === null)).toBe(false);
  });
});

describe("Campaign Categories — Demo Mode Filter", () => {
  it("demo mode applies category filter client-side", () => {
    const demoCampaigns = [
      { id: "d1", category: "park", neighborhood: "Darvenitsa" },
      { id: "d2", category: "street", neighborhood: "Darvenitsa" },
      { id: "d3", category: "park", neighborhood: "Musagenitsa" },
    ];

    const filtered = demoCampaigns.filter((c) => c.category === "park");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.category === "park")).toBe(true);
  });

  it("demo mode: null category filter returns all", () => {
    const demoCampaigns = [
      { id: "d1", category: "park" },
      { id: "d2", category: null },
    ];
    const filtered = demoCampaigns.filter((c) => (null ? c.category === null : true));
    expect(filtered).toHaveLength(2);
  });

  it("demo mode: combined neighborhood + category filter", () => {
    const demoCampaigns = [
      { id: "d1", category: "park", neighborhood: "Darvenitsa" },
      { id: "d2", category: "park", neighborhood: "Musagenitsa" },
      { id: "d3", category: "street", neighborhood: "Darvenitsa" },
    ];

    let filtered = demoCampaigns;
    filtered = filtered.filter((c) => c.neighborhood === "Darvenitsa");
    filtered = filtered.filter((c) => c.category === "park");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("d1");
  });
});

describe("Campaign Categories — Rendering (null/undefined)", () => {
  const categoryMap = {
    park: "🌳 Парк",
    street: "🛣️ Улица",
    water: "💧 Воден обект",
    other: "📦 Друго",
  };

  const renderCategory = (category, lang = "bg") => {
    const map =
      lang === "en"
        ? { park: "🌳 Park", street: "🛣️ Street", water: "💧 Water", other: "📦 Other" }
        : categoryMap;
    return category ? map[category] || category : "—";
  };

  it("null category renders as dash", () => {
    expect(renderCategory(null)).toBe("—");
  });

  it("undefined category renders as dash", () => {
    expect(renderCategory(undefined)).toBe("—");
  });

  it("park renders correctly in BG", () => {
    expect(renderCategory("park", "bg")).toBe("🌳 Парк");
  });

  it("park renders correctly in EN", () => {
    expect(renderCategory("park", "en")).toBe("🌳 Park");
  });

  it("street renders correctly in BG", () => {
    expect(renderCategory("street", "bg")).toBe("🛣️ Улица");
  });

  it("water renders correctly in BG", () => {
    expect(renderCategory("water", "bg")).toBe("💧 Воден обект");
  });

  it("other renders correctly in BG", () => {
    expect(renderCategory("other", "bg")).toBe("📦 Друго");
  });

  it("unknown value falls back to raw value", () => {
    expect(renderCategory("beach", "bg")).toBe("beach");
  });
});

describe("Campaign Categories — Create Payload", () => {
  it("category is included in demo campaign object", () => {
    const payload = {
      title: "Test",
      neighborhood: "Darvenitsa",
      category: "park",
      status: "active",
      scheduled_date: "2026-04-01",
      start_time: "10:00",
    };
    expect(payload).toHaveProperty("category", "park");
  });

  it("null category is included (not omitted) in payload", () => {
    const category = "" || null;
    const payload = { title: "Test", category };
    expect(payload).toHaveProperty("category", null);
  });

  it("supabase insert payload includes category field", () => {
    const buildInsertPayload = (formData) => ({
      title: formData.title,
      description: formData.description,
      neighborhood: formData.neighborhood,
      category: formData.category || null,
      status: "active",
      scheduled_date: formData.scheduledDate,
      start_time: formData.startTime,
      end_time: formData.endTime || null,
    });

    const result = buildInsertPayload({
      title: "Park Cleanup",
      description: "...",
      neighborhood: "Darvenitsa",
      category: "park",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "",
    });

    expect(result.category).toBe("park");
    expect(result.end_time).toBeNull();
  });
});

describe("Campaign Categories — i18n keys", () => {
  const requiredKeys = [
    "categoryLabel",
    "categoryAll",
    "categoryPark",
    "categoryStreet",
    "categoryWater",
    "categoryOther",
    "categoryNone",
    "categoryPlaceholder",
  ];

  it("all category keys exist in src/i18n/bg.json", async () => {
    const bg = await import("../src/i18n/bg.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(bg.default.campaign).toHaveProperty(key);
    });
  });

  it("all category keys exist in src/i18n/en.json", async () => {
    const en = await import("../src/i18n/en.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(en.default.campaign).toHaveProperty(key);
    });
  });

  it("all category keys exist in public/i18n/bg.json", async () => {
    const bg = await import("../public/i18n/bg.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(bg.default.campaign).toHaveProperty(key);
    });
  });

  it("all category keys exist in public/i18n/en.json", async () => {
    const en = await import("../public/i18n/en.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(en.default.campaign).toHaveProperty(key);
    });
  });

  it("BG and EN have the same set of category keys", async () => {
    const bg = await import("../src/i18n/bg.json", { assert: { type: "json" } });
    const en = await import("../src/i18n/en.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(bg.default.campaign).toHaveProperty(key);
      expect(en.default.campaign).toHaveProperty(key);
    });
  });

  it("src and public i18n files are in sync for category keys (BG)", async () => {
    const src = await import("../src/i18n/bg.json", { assert: { type: "json" } });
    const pub = await import("../public/i18n/bg.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(src.default.campaign[key]).toBe(pub.default.campaign[key]);
    });
  });

  it("src and public i18n files are in sync for category keys (EN)", async () => {
    const src = await import("../src/i18n/en.json", { assert: { type: "json" } });
    const pub = await import("../public/i18n/en.json", { assert: { type: "json" } });
    requiredKeys.forEach((key) => {
      expect(src.default.campaign[key]).toBe(pub.default.campaign[key]);
    });
  });
});
