// Unit tests for campaign date/time feature
// Tests the formatting and validation logic used in dashboard.js and campaign-detail.js

// ─── Helpers extracted from production code ───────────────────────────────────

/**
 * Builds the short date+time label shown on dashboard campaign cards.
 * Mirrors the logic in dashboard.js buildCampaignCard().
 */
function buildScheduledLabel(campaign, lang = "bg") {
  if (!campaign.scheduled_date || !campaign.start_time) return "";
  const [yr, mo, dy] = campaign.scheduled_date.split("-");
  const locale = lang === "bg" ? "bg-BG" : "en-US";
  const dateFmt = new Date(+yr, +mo - 1, +dy).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  const startFmt = campaign.start_time.slice(0, 5);
  return campaign.end_time
    ? `${dateFmt} · ${startFmt} – ${campaign.end_time.slice(0, 5)}`
    : `${dateFmt} · ${startFmt}`;
}

/**
 * Builds the full date+time string shown in the campaign detail "When" row.
 * Mirrors the logic in campaign-detail.js displayCampaignDetails().
 */
function buildScheduledDisplay(campaign, lang = "bg") {
  if (!campaign.scheduled_date || !campaign.start_time) return null; // caller shows noDate
  const [yr, mo, dy] = campaign.scheduled_date.split("-");
  const locale = lang === "bg" ? "bg-BG" : "en-US";
  const dateFmt = new Date(+yr, +mo - 1, +dy).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startFmt = campaign.start_time.slice(0, 5);
  if (campaign.end_time) {
    const endFmt = campaign.end_time.slice(0, 5);
    const range = `${startFmt} – ${endFmt}`;
    return `${dateFmt} · ${range}`;
  }
  return `${dateFmt} · ${startFmt}`;
}

/**
 * Validates that a date string (YYYY-MM-DD) is not in the past.
 * Mirrors the validation in create-campaign.js and campaign-detail.js.
 */
function isPastDate(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Campaign DateTime — Dashboard card label", () => {
  it("shows start + end time range when both are provided", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: "13:00:00",
    };
    const label = buildScheduledLabel(campaign, "en");
    expect(label).toContain("10:00");
    expect(label).toContain("13:00");
    expect(label).toContain("–");
  });

  it("shows only start time when end_time is null", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "09:00:00",
      end_time: null,
    };
    const label = buildScheduledLabel(campaign, "en");
    expect(label).toContain("09:00");
    expect(label).not.toContain("–");
  });

  it("returns empty string when scheduled_date is missing", () => {
    const campaign = { scheduled_date: null, start_time: "10:00:00", end_time: null };
    expect(buildScheduledLabel(campaign)).toBe("");
  });

  it("returns empty string when start_time is missing", () => {
    const campaign = { scheduled_date: "2026-03-22", start_time: null, end_time: null };
    expect(buildScheduledLabel(campaign)).toBe("");
  });

  it("trims seconds from time strings (DB returns HH:MM:SS)", () => {
    const campaign = {
      scheduled_date: "2026-04-05",
      start_time: "11:00:00",
      end_time: "14:00:00",
    };
    const label = buildScheduledLabel(campaign, "en");
    // Must show HH:MM, not HH:MM:SS
    expect(label).toMatch(/11:00/);
    expect(label).toMatch(/14:00/);
    expect(label).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it("formats date correctly for Bulgarian locale", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: null,
    };
    // Should contain the day number
    const label = buildScheduledLabel(campaign, "bg");
    expect(label).toContain("22");
  });

  it("formats date correctly for English locale", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: null,
    };
    const label = buildScheduledLabel(campaign, "en");
    expect(label).toContain("22");
    expect(label).toContain("Mar");
  });
});

describe("Campaign DateTime — Detail page 'When' row", () => {
  it("returns full date with time range when both times provided", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: "13:00:00",
    };
    const display = buildScheduledDisplay(campaign, "en");
    expect(display).not.toBeNull();
    expect(display).toContain("10:00");
    expect(display).toContain("13:00");
    expect(display).toContain("–");
    expect(display).toContain("2026");
  });

  it("returns full date with only start time when end_time is null", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "09:00:00",
      end_time: null,
    };
    const display = buildScheduledDisplay(campaign, "en");
    expect(display).toContain("09:00");
    expect(display).not.toContain("–");
  });

  it("returns null when scheduled_date is absent (caller shows noDate fallback)", () => {
    const campaign = { scheduled_date: null, start_time: "10:00:00", end_time: null };
    expect(buildScheduledDisplay(campaign)).toBeNull();
  });

  it("returns null when start_time is absent", () => {
    const campaign = { scheduled_date: "2026-03-22", start_time: null, end_time: null };
    expect(buildScheduledDisplay(campaign)).toBeNull();
  });

  it("includes month name for Bulgarian locale", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: null,
    };
    const display = buildScheduledDisplay(campaign, "bg");
    // bg-BG March = "март"
    expect(display).toMatch(/март/i);
  });

  it("includes month name for English locale", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00:00",
      end_time: null,
    };
    const display = buildScheduledDisplay(campaign, "en");
    expect(display).toMatch(/march/i);
  });
});

describe("Campaign DateTime — Past date validation", () => {
  it("returns true for a date clearly in the past", () => {
    expect(isPastDate("2020-01-01")).toBe(true);
  });

  it("returns false for a date clearly in the future", () => {
    expect(isPastDate("2099-12-31")).toBe(false);
  });

  it("returns false for today (today is allowed)", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(isPastDate(today)).toBe(false);
  });

  it("returns false when dateStr is empty/null", () => {
    expect(isPastDate("")).toBe(false);
    expect(isPastDate(null)).toBe(false);
    expect(isPastDate(undefined)).toBe(false);
  });

  it("returns true for yesterday", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    expect(isPastDate(yesterday)).toBe(true);
  });

  it("returns false for tomorrow", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    expect(isPastDate(tomorrow)).toBe(false);
  });
});

describe("Campaign DateTime — Time trimming edge cases", () => {
  it("handles time stored as HH:MM (without seconds)", () => {
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "10:00",
      end_time: "13:00",
    };
    const label = buildScheduledLabel(campaign, "en");
    expect(label).toContain("10:00");
    expect(label).toContain("13:00");
  });

  it("does not confuse midnight (00:00) as falsy", () => {
    // "00:00" is truthy as a string — should not fall back to noDate
    const campaign = {
      scheduled_date: "2026-03-22",
      start_time: "00:00:00",
      end_time: null,
    };
    const label = buildScheduledLabel(campaign, "en");
    expect(label).toContain("00:00");
    expect(label).not.toBe("");
  });
});
