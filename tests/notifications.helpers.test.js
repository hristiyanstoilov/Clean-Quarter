/**
 * Notification Helpers — Behavioral Tests
 *
 * Tests parseMessageData, iconForNotification, and NOTIFICATION_FALLBACK
 * as exported pure functions. Testable without DOM or Supabase dependencies.
 */

import {
  parseMessageData,
  TYPE_ICON,
  iconForNotification,
  NOTIFICATION_FALLBACK,
} from "../src/services/notifications.helpers.js";
import { describe, it, expect } from "vitest";

// ─── parseMessageData ─────────────────────────────────────────────────────────

describe("parseMessageData — null / undefined input", () => {
  it("returns null for null", () => {
    expect(parseMessageData(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseMessageData(undefined)).toBeNull();
  });
});

describe("parseMessageData — JSONB object input", () => {
  it("returns the object as-is", () => {
    const msg = { key: "notification.participationApproved", points: 20 };
    expect(parseMessageData(msg)).toBe(msg);
  });

  it("returns array as-is (typeof object)", () => {
    expect(parseMessageData([])).toEqual([]);
  });
});

describe("parseMessageData — JSON string input", () => {
  it("parses valid JSON string to object", () => {
    const raw = '{"key":"notification.participationApproved","points":20}';
    expect(parseMessageData(raw)).toEqual({ key: "notification.participationApproved", points: 20 });
  });

  it("returns null for plain-text string (not JSON)", () => {
    expect(parseMessageData("Участието беше одобрено")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseMessageData("{invalid}")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseMessageData("")).toBeNull();
  });
});

describe("parseMessageData — other types", () => {
  it("returns null for numbers", () => {
    expect(parseMessageData(42)).toBeNull();
  });

  it("returns null for booleans", () => {
    expect(parseMessageData(true)).toBeNull();
  });
});

// ─── TYPE_ICON ────────────────────────────────────────────────────────────────

describe("TYPE_ICON — structure", () => {
  it("has approval → ✅", () => expect(TYPE_ICON.approval).toBe("✅"));
  it("has rejected → ❌", () => expect(TYPE_ICON.rejected).toBe("❌"));
  it("has points → ⭐", () => expect(TYPE_ICON.points).toBe("⭐"));
  it("has campaign_update → 📢", () => expect(TYPE_ICON.campaign_update).toBe("📢"));
});

// ─── iconForNotification ──────────────────────────────────────────────────────

describe("iconForNotification — JSONB object input", () => {
  it("returns ❌ for JSONB rejection object", () => {
    expect(
      iconForNotification("approval", { key: "notification.participationRejected" })
    ).toBe("❌");
  });

  it("returns ✅ for JSONB approval object (no false positive)", () => {
    expect(
      iconForNotification("approval", { key: "notification.participationApproved", points: 20 })
    ).toBe("✅");
  });

  it("returns ⭐ for points type with JSONB object", () => {
    expect(
      iconForNotification("points", { key: "notification.pointsEarned", points: 10 })
    ).toBe("⭐");
  });
});

describe("iconForNotification — JSON string input", () => {
  it("returns ❌ for JSON string rejection", () => {
    const msg = '{"key":"notification.participationRejected","reason":"Too late"}';
    expect(iconForNotification("approval", msg)).toBe("❌");
  });

  it("returns ✅ for JSON string approval", () => {
    const msg = '{"key":"notification.participationApproved","points":20}';
    expect(iconForNotification("approval", msg)).toBe("✅");
  });
});

describe("iconForNotification — legacy plain-text input", () => {
  it("returns ❌ for BG rejection text with type=approval", () => {
    expect(iconForNotification("approval", "Участието ти беше отхвърлено.")).toBe("❌");
  });

  it("returns ❌ for EN rejection text with type=approval", () => {
    expect(iconForNotification("approval", "Your participation was rejected.")).toBe("❌");
  });

  it("returns ✅ for approval text without rejection keywords", () => {
    expect(iconForNotification("approval", "Участието ти беше одобрено!")).toBe("✅");
  });
});

describe("iconForNotification — edge cases", () => {
  it("returns 🔔 for null message", () => {
    expect(iconForNotification("unknown", null)).toBe("🔔");
  });

  it("returns 🔔 for undefined message", () => {
    expect(iconForNotification("unknown", undefined)).toBe("🔔");
  });

  it("returns 🔔 for unknown type with no rejection keywords", () => {
    expect(iconForNotification("mystery_type", "some text")).toBe("🔔");
  });

  it("returns 📢 for campaign_update type", () => {
    expect(iconForNotification("campaign_update", null)).toBe("📢");
  });
});

// ─── NOTIFICATION_FALLBACK ────────────────────────────────────────────────────

describe("NOTIFICATION_FALLBACK — structure", () => {
  it("covers all 7 notification keys", () => {
    const keys = [
      "notification.participationApproved",
      "notification.participationRejected",
      "notification.campaignJoin",
      "notification.campaignCompleted",
      "notification.pointsEarned",
      "notification.newComment",
      "notification.reportResolved",
    ];
    keys.forEach((k) => expect(NOTIFICATION_FALLBACK).toHaveProperty(k));
  });

  it("all values are functions", () => {
    Object.values(NOTIFICATION_FALLBACK).forEach((fn) =>
      expect(typeof fn).toBe("function")
    );
  });
});

describe("NOTIFICATION_FALLBACK — participationApproved", () => {
  const fn = NOTIFICATION_FALLBACK["notification.participationApproved"];

  it("includes points when present", () => {
    expect(fn({ points: 20 })).toContain("20");
    expect(fn({ points: 20 })).toContain("точки");
  });

  it("omits points clause when points is falsy", () => {
    const result = fn({});
    expect(result).not.toContain("Спечели");
    expect(result).toContain("одобрено");
  });
});

describe("NOTIFICATION_FALLBACK — participationRejected", () => {
  const fn = NOTIFICATION_FALLBACK["notification.participationRejected"];

  it("includes reason when present", () => {
    expect(fn({ reason: "Too late" })).toContain("Too late");
    expect(fn({ reason: "Too late" })).toContain("Причина");
  });

  it("omits 'Причина:' clause when reason is absent", () => {
    const result = fn({});
    expect(result).not.toContain("Причина");
    expect(result).toContain("отхвърлено");
  });

  it("omits 'Причина:' clause when reason is null", () => {
    expect(fn({ reason: null })).not.toContain("Причина");
  });
});

describe("NOTIFICATION_FALLBACK — pointsEarned", () => {
  const fn = NOTIFICATION_FALLBACK["notification.pointsEarned"];

  it("includes points when present", () => {
    expect(fn({ points: 15 })).toContain("15");
  });

  it("graceful when points is absent", () => {
    expect(() => fn({})).not.toThrow();
    expect(fn({})).toContain("точки");
  });
});
