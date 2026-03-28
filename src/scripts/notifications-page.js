import { initPage } from "../utils/pageInit.js";
import { initI18n, t, applyLanguage } from "../utils/i18n.js";
import supabase from "../services/supabase.js";
import { escapeHTML } from "../utils/helpers.js";
import {
  parseMessageData,
  iconForNotification,
  NOTIFICATION_FALLBACK,
} from "../services/notifications.helpers.js";

const PAGE_SIZE = 30;
let offset = 0;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
  initPage();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) {
    window.location.href = "/";
    return;
  }
  currentUserId = user.id;

  await initI18n();
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  applyLanguage(lang);

  setupNav(user);
  await loadNotifications();
  setupMarkAllRead();
  setupLoadMore();
});

function setupNav(user) {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  }

  if (user.role === "admin" || user.role === "superadmin") {
    const adminNav = document.getElementById("adminNavItem");
    if (adminNav) adminNav.style.display = "block";
  }

  const langSelector = document.getElementById("languageSelector");
  if (langSelector) {
    langSelector.value = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    langSelector.addEventListener("change", async (e) => {
      const { setLanguage } = await import("../utils/i18n.js");
      setLanguage(e.target.value);
    });
  }
}

async function fetchPage(userId, from) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, message, type, is_read, campaign_id, participation_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data || [];
}

function resolveMessage(message) {
  const data = parseMessageData(message);
  if (data === null) return typeof message === "string" ? message : String(message ?? "");
  if (!data.key) return typeof message === "string" ? message : "";
  const translated = t(data.key, data);
  if (translated !== data.key) return translated;
  const fallback = NOTIFICATION_FALLBACK[data.key];
  if (fallback) return fallback(data);
  return data.key;
}

function timeLabel(dateStr, lang) {
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

function renderItems(notifications) {
  const list = document.getElementById("notificationsList");
  if (!list) return;
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  notifications.forEach((n) => {
    const icon = iconForNotification(n.type, n.message);
    const msg = resolveMessage(n.message);
    const time = timeLabel(n.created_at, lang);
    const unreadClass = n.is_read ? "" : " notification-item--unread";
    const dest = n.campaign_id
      ? `/campaign/${n.campaign_id}`
      : n.participation_id
        ? "/profile"
        : null;

    const el = document.createElement("div");
    el.className = `notification-item${unreadClass} p-3 mb-2 rounded border bg-white d-flex gap-3 align-items-start`;
    el.dataset.id = n.id;
    if (dest) el.style.cursor = "pointer";
    el.innerHTML = `
      <span style="font-size:1.4rem">${icon}</span>
      <div class="flex-grow-1">
        <p class="mb-1">${escapeHTML(msg)}</p>
        <small class="text-muted">${time}${dest ? ' <span style="color:#28a745">→</span>' : ""}</small>
      </div>
      ${!n.is_read ? '<span class="notification-dot"></span>' : ""}
    `;

    if (dest) {
      el.addEventListener("click", async () => {
        if (!n.is_read) {
          await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
          el.classList.remove("notification-item--unread");
          el.querySelector(".notification-dot")?.remove();
        }
        window.location.href = dest;
      });
    }

    list.appendChild(el);
  });
}

async function loadNotifications() {
  const items = await fetchPage(currentUserId, offset);
  renderItems(items);
  offset += items.length;

  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const allLoadedMsg = document.getElementById("allLoadedMsg");

  if (items.length < PAGE_SIZE) {
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    if (offset > 0 && allLoadedMsg) allLoadedMsg.style.display = "block";
  } else {
    if (loadMoreBtn) loadMoreBtn.style.display = "inline-block";
    if (allLoadedMsg) allLoadedMsg.style.display = "none";
  }

  if (offset === 0) {
    const list = document.getElementById("notificationsList");
    if (list)
      list.innerHTML = `<p class="text-muted text-center py-4">${t("notifications.empty")}</p>`;
  }
}

function setupMarkAllRead() {
  document.getElementById("markAllReadBtn")?.addEventListener("click", async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);
    document.querySelectorAll(".notification-item--unread").forEach((el) => {
      el.classList.remove("notification-item--unread");
      el.querySelector(".notification-dot")?.remove();
    });
  });
}

function setupLoadMore() {
  document.getElementById("loadMoreBtn")?.addEventListener("click", loadNotifications);
}
