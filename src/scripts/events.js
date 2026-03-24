import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import { escapeHTML, initSwalFallback } from "../utils/helpers.js";
import { cancelRsvp } from "../services/events.js";
import { isDemoUser, getDemoCampaigns, getDemoRsvps, removeDemoRsvp } from "../utils/demoMode.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";
import { initBottomNav } from "../hooks/index.js";

let currentUser = null;

// ─── Init ──────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  initNetworkStatusBanner();
  initBottomNav();
  initSwalFallback();

  try {
    await initI18n(false);
    applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");

    // Language selector
    const langSel = document.getElementById("languageSelector");
    langSel.value = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    langSel.style.display = "block";
    langSel.addEventListener("change", (e) => {
      setLanguage(e.target.value, true);
      location.reload();
    });

    // Admin nav
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser?.role === "admin") {
      const adminNavItem = document.getElementById("adminNavItem");
      if (adminNavItem) adminNavItem.style.display = "block";
    }

    // Notification bell (skip demo users)
    if (storedUser?.id && !isDemoUser(storedUser)) {
      import("../services/notifications.js").then(({ initNotificationBell }) => {
        initNotificationBell(storedUser.id);
      });
    }

    document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const { logout } = await import("../services/auth.js");
      const { removeUser } = await import("../utils/helpers.js");
      await logout();
      removeUser();
      window.location.href = "/";
    });

    await checkAuth();

    // Load both sections in parallel
    await Promise.all([loadMyRsvps(), loadAllUpcoming()]);
  } catch (err) {
    console.error("[events] init error:", err);
  }
});

// ─── Auth ──────────────────────────────────────────────────────────────────

async function checkAuth() {
  const localUser = localStorage.getItem("user");
  if (localUser) {
    try {
      currentUser = JSON.parse(localUser);
      return;
    } catch {
      // fall through to Supabase check
    }
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    window.location.href = "/";
    return;
  }
  currentUser = user;
}

// ─── Data loading ──────────────────────────────────────────────────────────

async function loadMyRsvps() {
  const spinner = document.getElementById("myRsvpsSpinner");
  const container = document.getElementById("myRsvpsContainer");
  const empty = document.getElementById("myRsvpsEmpty");

  try {
    const today = new Date().toISOString().split("T")[0];
    let campaigns = [];

    if (isDemoUser(currentUser)) {
      const rsvps = getDemoRsvps().filter((r) => r.user_id === currentUser.id);
      const ids = new Set(rsvps.map((r) => r.campaign_id));
      campaigns = getDemoCampaigns().filter(
        (c) => ids.has(c.id) && c.status === "active" && c.scheduled_date >= today
      );
    } else {
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("campaign_id")
        .eq("user_id", currentUser.id);

      if (rsvps?.length) {
        const ids = rsvps.map((r) => r.campaign_id);
        const { data } = await supabase
          .from("campaigns")
          .select(
            "id, title, neighborhood, category, before_photo_url, scheduled_date, start_time, status"
          )
          .in("id", ids)
          .eq("status", "active")
          .gte("scheduled_date", today)
          .order("scheduled_date", { ascending: true });
        campaigns = data || [];
      }
    }

    spinner.style.display = "none";

    if (!campaigns.length) {
      empty.style.display = "block";
      return;
    }

    container.innerHTML = campaigns.map((c) => buildEventCard(c, true)).join("");
    container.style.display = "grid";

    // Wire cancel RSVP buttons
    container.querySelectorAll("[data-cancel-rsvp]").forEach((btn) => {
      btn.addEventListener("click", () => handleCancelRsvp(btn.dataset.cancelRsvp, btn));
    });
  } catch (err) {
    console.error("[events] loadMyRsvps error:", err);
    spinner.style.display = "none";
    empty.style.display = "block";
  }
}

async function loadAllUpcoming() {
  const spinner = document.getElementById("allEventsSpinner");
  const container = document.getElementById("allEventsContainer");
  const empty = document.getElementById("allEventsEmpty");

  try {
    const today = new Date().toISOString().split("T")[0];
    let campaigns = [];

    if (isDemoUser(currentUser)) {
      campaigns = getDemoCampaigns()
        .filter((c) => c.status === "active" && c.scheduled_date >= today)
        .slice(0, 20);
    } else {
      const { data } = await supabase
        .from("campaigns")
        .select(
          "id, title, neighborhood, category, before_photo_url, scheduled_date, start_time, status"
        )
        .eq("status", "active")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(20);
      campaigns = data || [];
    }

    spinner.style.display = "none";

    if (!campaigns.length) {
      empty.style.display = "block";
      return;
    }

    container.innerHTML = campaigns.map((c) => buildEventCard(c, false)).join("");
    container.style.display = "grid";
  } catch (err) {
    console.error("[events] loadAllUpcoming error:", err);
    spinner.style.display = "none";
    empty.style.display = "block";
  }
}

// ─── Card builder ─────────────────────────────────────────────────────────

const CATEGORY_EMOJI = { park: "🌳", street: "🛣️", water: "💧", other: "📦" };

function buildEventCard(campaign, showCancel) {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  let title = campaign.title;
  try {
    title = JSON.parse(title);
  } catch {}
  if (typeof title === "object") title = title[lang] || title.bg || title.en || "";

  const dateLabel = campaign.scheduled_date
    ? new Date(campaign.scheduled_date).toLocaleDateString(lang === "bg" ? "bg-BG" : "en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";
  const timeLabel = campaign.start_time ? campaign.start_time.slice(0, 5) : "";
  const emoji = CATEGORY_EMOJI[campaign.category] || "📦";
  const cancelBtn = showCancel
    ? `<button class="btn btn-sm btn-outline-danger mt-2" data-cancel-rsvp="${escapeHTML(campaign.id)}" data-i18n="events.cancelRsvp">${t("events.cancelRsvp")}</button>`
    : "";
  const rsvpBadge = showCancel
    ? `<span class="badge bg-success ms-2">${t("events.rsvpBadge")}</span>`
    : "";

  return `
    <div class="event-card" data-id="${escapeHTML(campaign.id)}">
      <div class="event-card__header">
        <span class="campaign-category-badge">${emoji}</span>
        <span class="event-card__neighborhood">${escapeHTML(campaign.neighborhood || "")}</span>
        ${rsvpBadge}
      </div>
      <h3 class="event-card__title">${escapeHTML(title)}</h3>
      <div class="event-card__date">
        📅 ${escapeHTML(dateLabel)}${timeLabel ? ` · ${escapeHTML(timeLabel)}` : ""}
      </div>
      <div class="event-card__actions">
        <a href="/campaign/${escapeHTML(campaign.id)}" class="btn btn-sm btn-outline-success" data-i18n="events.view">${t("events.view")}</a>
        ${cancelBtn}
      </div>
    </div>`;
}

// ─── Actions ──────────────────────────────────────────────────────────────

async function handleCancelRsvp(campaignId, btn) {
  btn.disabled = true;
  try {
    if (isDemoUser(currentUser)) {
      removeDemoRsvp(campaignId, currentUser.id);
    } else {
      await cancelRsvp(campaignId, currentUser.id);
    }
    // Remove the card from the My RSVPs section
    const card = btn.closest(".event-card");
    if (card) card.remove();
    // Show empty state if no cards remain
    const container = document.getElementById("myRsvpsContainer");
    if (container && !container.querySelector(".event-card")) {
      container.style.display = "none";
      const empty = document.getElementById("myRsvpsEmpty");
      if (empty) empty.style.display = "block";
    }
  } catch (err) {
    console.error("[events] cancelRsvp error:", err);
    btn.disabled = false;
  }
}
