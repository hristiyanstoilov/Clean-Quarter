/**
 * Notifications Service Tests
 *
 * Static analysis of src/services/notifications.js and the six page HTML files
 * that embed the notification bell.
 *
 * Covers:
 *  - Source exports and Supabase query patterns
 *  - initNotificationBell encapsulates all DOM wiring
 *  - Badge capping logic (>99 → "99+")
 *  - Icon selection logic (approval vs rejected, points, campaign_update)
 *  - timeAgo formatting in BG and EN
 *  - All 6 page HTML files contain the required bell elements
 *  - All 6 page JS files call initNotificationBell (skip demo users)
 *  - navbar.html uses centralized initNotificationBell
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

const svcSrc = readFileSync(resolve(ROOT, "src/services/notifications.js"), "utf-8");

// ─── Source-level static checks ──────────────────────────────────────────────

describe("Notifications service — exports", () => {
  const exports = [
    "fetchNotifications",
    "markAsRead",
    "markAllAsRead",
    "subscribeToNotifications",
    "renderNotifications",
    "updateBadge",
    "initNotificationBell",
  ];

  exports.forEach((name) => {
    it(`exports ${name}`, () => {
      const exported =
        svcSrc.includes(`export async function ${name}`) ||
        svcSrc.includes(`export function ${name}`);
      expect(exported).toBe(true);
    });
  });
});

describe("Notifications service — Supabase queries", () => {
  it("fetchNotifications orders by created_at descending", () => {
    expect(svcSrc).toContain('.order("created_at", { ascending: false })');
  });

  it("fetchNotifications limits to 20 results", () => {
    expect(svcSrc).toContain(".limit(20)");
  });

  it("markAllAsRead only updates unread rows", () => {
    expect(svcSrc).toContain('.eq("is_read", false)');
  });

  it("subscribeToNotifications listens for INSERT on notifications", () => {
    expect(svcSrc).toContain('event: "INSERT"');
    expect(svcSrc).toContain('table: "notifications"');
  });

  it("subscribeToNotifications filters by user_id", () => {
    expect(svcSrc).toContain("user_id=eq.");
  });

  it("unsubscribes the channel on page unload to prevent connection leaks", () => {
    expect(svcSrc).toContain("beforeunload");
    expect(svcSrc).toContain("channel.unsubscribe()");
  });

  it("notification click navigates to /campaign/:id route, not /campaign-detail", () => {
    expect(svcSrc).toContain("/campaign/${notif.campaign_id}");
    expect(svcSrc).not.toContain("/campaign-detail?id=");
  });
});

describe("Notifications service — badge logic", () => {
  it("caps badge at 99+", () => {
    expect(svcSrc).toContain('"99+"');
    expect(svcSrc).toContain("count > 99");
  });

  it("hides badge when count is zero", () => {
    expect(svcSrc).toContain('classList.add("d-none")');
  });

  it("shows badge when count > 0", () => {
    expect(svcSrc).toContain('classList.remove("d-none")');
  });
});

describe("Notifications service — icon logic", () => {
  it("maps approval type to ✅ icon", () => {
    expect(svcSrc).toContain('approval: "✅"');
  });

  it("maps points type to ⭐ icon", () => {
    expect(svcSrc).toContain('points: "⭐"');
  });

  it("maps campaign_update type to 📢 icon", () => {
    expect(svcSrc).toContain('campaign_update: "📢"');
  });

  it("detects rejected approval by checking message content", () => {
    // Approval + "отхвърл" in message → ❌ icon
    expect(svcSrc).toContain('"отхвърл"');
    expect(svcSrc).toContain('"rejected"');
  });

  it("falls back to 🔔 for unknown types", () => {
    expect(svcSrc).toContain('"🔔"');
  });

  it("iconForNotification guards against JSONB object input before JSON.parse", () => {
    // Bug: when Supabase returns message as a parsed JS object (JSONB),
    // JSON.parse(objectValue) throws a SyntaxError which is silently caught,
    // causing rejection notifications to show ✅ instead of ❌.
    // Fix: add typeof === "object" guard identical to resolveMessage's guard.
    const fnMatch = svcSrc.match(/function iconForNotification[\s\S]*?\n\}/);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch[0]).toContain('typeof message');
  });
});

describe("Notifications service — timeAgo formatting", () => {
  it("has Bulgarian time labels", () => {
    expect(svcSrc).toContain("току-що");
    expect(svcSrc).toContain("преди");
    expect(svcSrc).toContain("мин");
  });

  it("has English time labels", () => {
    expect(svcSrc).toContain("just now");
    expect(svcSrc).toContain("m ago");
    expect(svcSrc).toContain("h ago");
    expect(svcSrc).toContain("d ago");
  });
});

describe("Notifications service — unread item rendering", () => {
  it("marks unread items with notification-item--unread class", () => {
    expect(svcSrc).toContain("notification-item--unread");
  });

  it("adds notification-dot for unread items", () => {
    expect(svcSrc).toContain("notification-dot");
  });

  it("renders empty state message when no notifications", () => {
    expect(svcSrc).toContain("notification-empty");
  });
});

// ─── Page HTML integrity ──────────────────────────────────────────────────────

const pages = [
  { name: "Dashboard", html: "src/pages/dashboard.html", js: "src/scripts/dashboard.js" },
  { name: "Profile", html: "src/pages/profile.html", js: "src/scripts/profile.js" },
  { name: "Rewards", html: "src/pages/rewards.html", js: "src/scripts/rewards.js" },
  { name: "Create Campaign", html: "src/pages/create-campaign.html", js: "src/scripts/create-campaign.js" },
  { name: "Campaign Detail", html: "src/pages/campaign-detail.html", js: "src/scripts/campaign-detail.js" },
  { name: "Admin", html: "src/pages/admin.html", js: "src/scripts/admin.js" },
];

describe("Notification bell — page HTML elements", () => {
  pages.forEach(({ name, html: htmlPath }) => {
    const html = readFileSync(resolve(ROOT, htmlPath), "utf-8");

    it(`${name}: has #notificationNavItem (hidden by default)`, () => {
      expect(html).toContain('id="notificationNavItem"');
      expect(html).toMatch(/id="notificationNavItem"[^>]*style="display:\s*none"/);
    });

    it(`${name}: has #notificationBell wrapper`, () => {
      expect(html).toContain('id="notificationBell"');
    });

    it(`${name}: has #notificationBtn button`, () => {
      expect(html).toContain('id="notificationBtn"');
    });

    it(`${name}: has #notificationBadge span`, () => {
      expect(html).toContain('id="notificationBadge"');
    });

    it(`${name}: has #notificationDropdown (hidden by default)`, () => {
      expect(html).toContain('id="notificationDropdown"');
    });

    it(`${name}: has #notificationList container`, () => {
      expect(html).toContain('id="notificationList"');
    });

    it(`${name}: has #markAllReadBtn button`, () => {
      expect(html).toContain('id="markAllReadBtn"');
    });

    it(`${name}: has i18n keys on bell elements`, () => {
      expect(html).toContain('data-i18n="notifications.title"');
      expect(html).toContain('data-i18n="notifications.markAllRead"');
      expect(html).toContain('data-i18n="notifications.empty"');
    });
  });
});

describe("Notification bell — page JS integration", () => {
  pages.forEach(({ name, js: jsPath }) => {
    const js = readFileSync(resolve(ROOT, jsPath), "utf-8");

    it(`${name}: imports initNotificationBell from notifications service`, () => {
      expect(js).toContain("initNotificationBell");
      expect(js).toContain("notifications.js");
    });

    it(`${name}: skips demo users via isDemoUser()`, () => {
      expect(js).toContain("isDemoUser");
    });
  });
});

// ─── navbar.html component ───────────────────────────────────────────────────

describe("Notification bell — navbar.html component", () => {
  const navbarSrc = readFileSync(resolve(ROOT, "src/components/navbar.html"), "utf-8");

  it("uses centralized initNotificationBell from service", () => {
    expect(navbarSrc).toContain("initNotificationBell");
    expect(navbarSrc).toContain("notifications.js");
  });

  it("skips demo users", () => {
    expect(navbarSrc).toContain("isDemoUser");
    expect(navbarSrc).toContain("demoMode.js");
  });

  it("has bell HTML elements", () => {
    expect(navbarSrc).toContain('id="notificationNavItem"');
    expect(navbarSrc).toContain('id="notificationBell"');
    expect(navbarSrc).toContain('id="notificationBadge"');
  });
});

// ─── i18n keys ───────────────────────────────────────────────────────────────

describe("Notification bell — i18n keys present in all 4 files", () => {
  const i18nFiles = [
    { lang: "BG (src)", path: "src/i18n/bg.json" },
    { lang: "EN (src)", path: "src/i18n/en.json" },
    { lang: "BG (public)", path: "public/i18n/bg.json" },
    { lang: "EN (public)", path: "public/i18n/en.json" },
  ];

  const requiredKeys = ["notifications.title", "notifications.markAllRead", "notifications.empty"];

  i18nFiles.forEach(({ lang, path }) => {
    const src = readFileSync(resolve(ROOT, path), "utf-8");
    requiredKeys.forEach((key) => {
      const jsonKey = key.split(".")[1];
      it(`${lang}: has "${jsonKey}" key`, () => {
        expect(src).toContain(`"${jsonKey}"`);
      });
    });
  });
});

// ─── Notification i18n keys ───────────────────────────────────────────────────

describe("Notification i18n — notification.* keys in all 4 files", () => {
  const i18nFiles = [
    { lang: "BG (src)", path: "src/i18n/bg.json" },
    { lang: "EN (src)", path: "src/i18n/en.json" },
    { lang: "BG (public)", path: "public/i18n/bg.json" },
    { lang: "EN (public)", path: "public/i18n/en.json" },
  ];

  const notifKeys = [
    "campaignCompleted",
    "campaignJoin",
    "participationApproved",
    "participationRejected",
    "newComment",
    "pointsEarned",
    "reportResolved",
  ];

  i18nFiles.forEach(({ lang, path }) => {
    const src = readFileSync(resolve(ROOT, path), "utf-8");
    it(`${lang}: has "notification" section`, () => {
      expect(src).toContain('"notification"');
    });
    notifKeys.forEach((key) => {
      it(`${lang}: has "notification.${key}"`, () => {
        expect(src).toContain(`"${key}"`);
      });
    });
  });
});

// ─── Notification trigger JSON format ────────────────────────────────────────

describe("Notification triggers — use json_build_object (i18n format)", () => {
  const migrationSrc = readFileSync(
    resolve(ROOT, "supabase/migrations/20260321132000_notification_i18n.sql"),
    "utf-8"
  );
  const schemaSrc = readFileSync(resolve(ROOT, "supabase/schema.sql"), "utf-8");

  const triggerKeys = [
    "notification.campaignCompleted",
    "notification.campaignJoin",
    "notification.participationApproved",
    "notification.newComment",
    "notification.pointsEarned",
    "notification.reportResolved",
  ];

  it("migration uses json_build_object for all triggers", () => {
    expect(migrationSrc).toContain("json_build_object");
    const count = (migrationSrc.match(/json_build_object/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(6);
  });

  triggerKeys.forEach((key) => {
    it(`migration stores key "${key}"`, () => {
      expect(migrationSrc).toContain(`'${key}'`);
    });
    it(`schema.sql stores key "${key}"`, () => {
      expect(schemaSrc).toContain(`'${key}'`);
    });
  });

  it("migration does not use hardcoded English notification strings", () => {
    expect(migrationSrc).not.toContain("has been completed!");
    expect(migrationSrc).not.toContain("joined your campaign");
    expect(migrationSrc).not.toContain("You earned");
    expect(migrationSrc).not.toContain("has been approved");
    expect(migrationSrc).not.toContain("commented on your campaign");
  });

  it("resolveMessage helper is present in notifications service", () => {
    expect(svcSrc).toContain("resolveMessage");
    expect(svcSrc).toContain("JSON.parse");
    expect(svcSrc).toContain("data.key");
  });

  it("notifications service imports i18n t() function", () => {
    expect(svcSrc).toContain('from "../utils/i18n.js"');
    expect(svcSrc).toContain("i18nT");
  });

  it("renderNotifications uses resolveMessage for message display", () => {
    expect(svcSrc).toContain("resolveMessage(n.message)");
  });

  it("emptyMsg uses i18n t() instead of hardcoded strings", () => {
    expect(svcSrc).toContain('i18nT("notifications.empty")');
    expect(svcSrc).not.toContain('"No notifications"');
    expect(svcSrc).not.toContain('"Няма известия"');
  });
});

// ─── Rejection notification ───────────────────────────────────────────────────

describe("Rejection notification — trigger and icon", () => {
  const migrationSrc = readFileSync(
    resolve(ROOT, "supabase/migrations/20260321152844_notify_participation_rejected.sql"),
    "utf-8"
  );
  const schemaSrc = readFileSync(resolve(ROOT, "supabase/schema.sql"), "utf-8");

  it("migration creates notify_participation_rejected function", () => {
    expect(migrationSrc).toContain("notify_participation_rejected");
    expect(migrationSrc).toContain("SECURITY DEFINER");
  });

  it("migration fires on status = 'rejected'", () => {
    expect(migrationSrc).toContain("'rejected'");
    expect(migrationSrc).toContain("OLD.status != 'rejected'");
  });

  it("migration stores participationRejected i18n key", () => {
    expect(migrationSrc).toContain("'notification.participationRejected'");
  });

  it("migration includes rejection_reason in JSON payload", () => {
    expect(migrationSrc).toContain("rejection_reason");
    expect(migrationSrc).toContain("COALESCE");
  });

  it("migration creates the trigger on participations table", () => {
    expect(migrationSrc).toContain("trigger_notify_participation_rejected");
    expect(migrationSrc).toContain("AFTER UPDATE ON participations");
  });

  it("schema.sql includes notify_participation_rejected function", () => {
    expect(schemaSrc).toContain("notify_participation_rejected");
    expect(schemaSrc).toContain("trigger_notify_participation_rejected");
  });

  it("iconForNotification detects rejection via JSON key", () => {
    expect(svcSrc).toContain("notification.participationRejected");
    expect(svcSrc).toContain("TYPE_ICON.rejected");
  });

  it("iconForNotification still has legacy plain-text fallback", () => {
    expect(svcSrc).toContain('"отхвърл"');
    expect(svcSrc).toContain('"rejected"');
  });
});
