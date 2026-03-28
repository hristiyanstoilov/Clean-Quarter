/**
 * Notification Service
 *
 * Fetches, renders, and subscribes to in-app notifications for the current user.
 * Notifications are written by DB triggers on: participation approval/rejection,
 * campaign join, points earned, and campaign completion.
 *
 * RLS policies ensure users only see their own notifications.
 */

import supabase from "./supabase.js";
import { t as i18nT } from "../utils/i18n.js";
import { escapeHTML } from "../utils/helpers.js";
import { parseMessageData, TYPE_ICON, iconForNotification } from "./notifications.helpers.js";

/**
 * Fetch the latest 20 notifications for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, message, type, is_read, campaign_id, participation_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 */
export async function markAsRead(notificationId) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
}

/**
 * Mark all unread notifications for a user as read.
 * @param {string} userId
 */
export async function markAllAsRead(userId) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

/**
 * Subscribe to new notifications for a user via Supabase Realtime.
 * @param {string} userId
 * @param {Function} callback  Called with the new notification payload
 * @returns {RealtimeChannel}
 */
export function subscribeToNotifications(userId, callback) {
  return supabase
    .channel(`notifications-user-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// ─── Message resolver ─────────────────────────────────────────────────────────

// Human-readable fallbacks used when i18n hasn't loaded yet.
// Keyed by the i18n key stored in the notification's JSON message.
const NOTIFICATION_FALLBACK = {
  "notification.participationApproved": (d) =>
    `Участието ти беше одобрено! Спечели ${d.points ?? ""} точки.`,
  "notification.participationRejected": (d) =>
    `Участието ти беше отхвърлено. Причина: ${d.reason ?? ""}`,
  "notification.campaignJoin": (d) =>
    `${d.username ?? ""} се присъедини към твоята кампания "${d.title ?? ""}".`,
  "notification.campaignCompleted": (d) => `Кампанията "${d.title ?? ""}" приключи!`,
  "notification.pointsEarned": (d) => `Спечели ${d.points ?? ""} точки!`,
  "notification.newComment": (d) =>
    `${d.username ?? ""} коментира твоята кампания "${d.title ?? ""}".`,
  "notification.reportResolved": () => "Твоят сигнал беше прегледан и решен.",
};

/**
 * Resolve a notification message for display.
 * New messages are stored as JSON {"key":"notification.X","param1":"..."}
 * and translated via i18n. Old plain-text messages are returned as-is.
 * @param {string} message
 * @returns {string}
 */
function resolveMessage(message) {
  if (message === null || message === undefined) return "";

  // Normalize JSONB (object or JSON string) → structured data object
  const data = parseMessageData(message);

  // Plain-text legacy message (parseMessageData returns null for non-JSON strings)
  if (data === null) {
    return typeof message === "string" ? message : String(message);
  }

  if (!data.key) return typeof message === "string" ? message : "";

  // Step 2: translate — isolated catch so a translation failure never returns raw JSON
  try {
    const translated = i18nT(data.key, data);
    if (translated !== data.key) return translated;
  } catch {
    // fall through to hardcoded fallback below
  }

  // Step 3: i18n not loaded or key missing — use hardcoded BG fallback
  const fallback = NOTIFICATION_FALLBACK[data.key];
  if (fallback) return fallback(data);
  return data.key; // last resort: show the key, not raw JSON
}

function timeAgo(dateStr, lang) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (lang === "en") {
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
  if (diff < 60) return "току-що";
  if (diff < 3600) return `преди ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `преди ${Math.floor(diff / 3600)} ч`;
  return `преди ${Math.floor(diff / 86400)} д`;
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/**
 * Render notification list into #notificationList.
 * @param {Array} notifications
 * @param {string} lang  "bg" or "en"
 * @param {Function} onItemClick  Called with notification object on click
 */
export function renderNotifications(notifications, lang, onItemClick) {
  const list = document.getElementById("notificationList");
  if (!list) return;

  const emptyMsg = i18nT("notifications.empty") || "Нямате известия";
  if (!notifications.length) {
    list.innerHTML = `<p class="notification-empty">${emptyMsg}</p>`;
    return;
  }

  list.innerHTML = notifications
    .map((n) => {
      const icon = iconForNotification(n.type, n.message);
      const time = timeAgo(n.created_at, lang);
      const unreadClass = n.is_read ? "" : " notification-item--unread";
      const msg = resolveMessage(n.message);
      const isLinked = !!(n.campaign_id || n.participation_id);
      const linkedClass = isLinked ? " notification-item--linked" : "";
      return `
        <div class="notification-item${unreadClass}${linkedClass}" data-id="${n.id}" data-campaign="${n.campaign_id || ""}" data-participation="${n.participation_id || ""}">
          <span class="notification-icon">${icon}</span>
          <div class="notification-body">
            <p class="notification-msg">${escapeHTML(msg)}</p>
            <span class="notification-time">${time}${isLinked ? ' <span class="notification-link-arrow">→</span>' : ""}</span>
          </div>
          ${!n.is_read ? '<span class="notification-dot"></span>' : ""}
        </div>`;
    })
    .join("");

  list.querySelectorAll(".notification-item").forEach((el) => {
    el.addEventListener("click", () => {
      const notif = notifications.find((n) => n.id === el.dataset.id);
      if (notif) onItemClick(notif);
    });
  });
}

/**
 * Update the badge number and visibility.
 * @param {number} count
 */
export function updateBadge(count) {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

// ─── Full bell initializer (used by all pages) ────────────────────────────────

/**
 * Initialize the notification bell for a given user.
 * Expects the following elements to exist in the DOM:
 *   #notificationNavItem, #notificationBtn, #notificationDropdown,
 *   #notificationList, #notificationBadge, #markAllReadBtn
 *
 * @param {string} userId
 */
export async function initNotificationBell(userId) {
  // Respect the user's notification preference — if disabled, hide the bell entirely
  const { data: profile } = await supabase
    .from("profiles")
    .select("notifications_enabled")
    .eq("id", userId)
    .single();
  if (profile && profile.notifications_enabled === false) return;

  const navItem = document.getElementById("notificationNavItem");
  if (navItem) navItem.style.display = "block";

  let lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  let _notifications = [];

  async function loadAndRender() {
    try {
      _notifications = await fetchNotifications(userId);
    } catch {
      return; // DB error — bell stays empty, non-critical
    }
    const unread = _notifications.filter((n) => !n.is_read).length;
    updateBadge(unread);
    renderNotifications(_notifications, lang, async (notif) => {
      if (!notif.is_read) {
        await markAsRead(notif.id);
        notif.is_read = true;
        updateBadge(_notifications.filter((n) => !n.is_read).length);
        const el = document.querySelector(`[data-id="${notif.id}"]`);
        if (el) {
          el.classList.remove("notification-item--unread");
          el.querySelector(".notification-dot")?.remove();
        }
      }
      const dest = notif.campaign_id
        ? `/campaign/${notif.campaign_id}`
        : notif.participation_id
          ? "/profile"
          : null;
      if (dest) {
        closeDropdown();
        window.location.href = dest;
      }
    });
  }

  await loadAndRender();

  const btn = document.getElementById("notificationBtn");
  const dropdown = document.getElementById("notificationDropdown");

  function closeDropdown() {
    if (dropdown) dropdown.style.display = "none";
  }

  if (btn && dropdown) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display !== "none" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!document.getElementById("notificationBell")?.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  const markAllBtn = document.getElementById("markAllReadBtn");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await markAllAsRead(userId);
      _notifications.forEach((n) => (n.is_read = true));
      updateBadge(0);
      renderNotifications(_notifications, lang, () => {});
    });
  }

  // Realtime: re-fetch when a new notification arrives
  const channel = subscribeToNotifications(userId, () => loadAndRender());

  // Keep lang in sync when the user switches language without a page reload
  function onLanguageChanged(e) {
    lang = e.detail?.lang || localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    renderNotifications(_notifications, lang, () => {});
  }
  window.addEventListener("languageChanged", onLanguageChanged);

  // Clean up the Realtime channel and language listener when the page unloads
  window.addEventListener(
    "beforeunload",
    () => {
      channel.unsubscribe();
      window.removeEventListener("languageChanged", onLanguageChanged);
    },
    { once: true }
  );
}
