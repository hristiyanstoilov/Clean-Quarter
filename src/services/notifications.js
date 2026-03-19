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

/**
 * Fetch the latest 20 notifications for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchNotifications(userId) {
  const { data } = await supabase
    .from("notifications")
    .select("id, message, type, is_read, campaign_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
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

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const TYPE_ICON = {
  approval: "✅",
  rejected: "❌",
  points: "⭐",
  campaign_update: "📢",
};

function iconForNotification(type, message) {
  if (type === "approval" && message && message.toLowerCase().includes("отхвърл")) {
    return TYPE_ICON.rejected;
  }
  if (type === "approval" && message && message.toLowerCase().includes("rejected")) {
    return TYPE_ICON.rejected;
  }
  return TYPE_ICON[type] || "🔔";
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
  const emptyMsg = lang === "en" ? "No notifications" : "Няма известия";
  if (!list) return;

  if (!notifications.length) {
    list.innerHTML = `<p class="notification-empty">${emptyMsg}</p>`;
    return;
  }

  list.innerHTML = notifications
    .map((n) => {
      const icon = iconForNotification(n.type, n.message);
      const time = timeAgo(n.created_at, lang);
      const unreadClass = n.is_read ? "" : " notification-item--unread";
      return `
        <div class="notification-item${unreadClass}" data-id="${n.id}" data-campaign="${n.campaign_id || ""}">
          <span class="notification-icon">${icon}</span>
          <div class="notification-body">
            <p class="notification-msg">${n.message}</p>
            <span class="notification-time">${time}</span>
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
  const navItem = document.getElementById("notificationNavItem");
  if (navItem) navItem.style.display = "block";

  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  let _notifications = [];

  async function loadAndRender() {
    _notifications = await fetchNotifications(userId);
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
      if (notif.campaign_id) {
        closeDropdown();
        window.location.href = `/campaign-detail?id=${notif.campaign_id}`;
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

  // Clean up the Realtime channel when the page unloads to avoid connection leaks
  window.addEventListener("beforeunload", () => channel.unsubscribe(), { once: true });
}
