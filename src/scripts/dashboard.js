import { initializeMap, loadMapData } from "../services/map.js";
import logger from "../services/logger.js";
import { logout } from "../services/auth.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import { localizeNeighborhood } from "../utils/neighborhoods.js";
import supabase from "../services/supabase.js";
import { fetchWeather } from "../services/weather.js";
import {
  requireAuth,
  removeUser,
  showLoading,
  hideLoading,
  handleError,
  isEmpty,
  escapeHTML,
  formatScheduledDate,
  showSuccessToast,
} from "../utils/helpers.js";
import { isDemoUser, getDemoCampaigns, getDemoRsvps } from "../utils/demoMode.js";
import { getRsvpCountsForCampaigns } from "../services/events.js";
import { CLEANUP_POINTS } from "../services/points.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";
import { initBottomNav } from "../hooks/index.js";
import { initPage } from "../utils/pageInit.js";
import { filterCampaigns } from "../utils/campaign-filters.js";

// Pagination state
const PAGE_SIZE = 9;
let currentOffset = 0;
let totalCount = 0;
let allDemoCampaigns = [];
let rawDemoCampaigns = []; // unfiltered source — preserved across filter changes

// Neighborhood filter state — null means "all"
let currentNeighborhoodFilter = null;

// Category filter state — null means "all"
let currentCategoryFilter = null;

// Search term state — empty string means "all"
let currentSearchTerm = "";

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  initPage();
  initNetworkStatusBanner();
  initBottomNav();
  try {
    // Initialize i18n first (realTime = false)
    await initI18n(false);
    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    applyLanguage(lang);

    // Language selector
    const langSelector = document.getElementById("languageSelector");
    langSelector.value = lang;
    langSelector.style.display = "block";
    langSelector.addEventListener("change", (e) => {
      setLanguage(e.target.value, true);
      location.reload();
    });

    // Require authentication
    requireAuth("/");

    // Onboarding overlay — shown once to first-time users
    if (!localStorage.getItem("onboarding_done")) {
      const overlay = document.getElementById("onboardingOverlay");
      if (overlay) {
        overlay.style.display = "flex";
        document.getElementById("onboardingDismissBtn")?.addEventListener("click", () => {
          localStorage.setItem("onboarding_done", "1");
          overlay.style.display = "none";
        });
      }
    }

    // Role-based UI
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role === "admin") {
      document.getElementById("adminNavItem").style.display = "block";
      loadAdminBanner();
    }

    // Notification bell (skip demo users)
    if (user?.id && !isDemoUser(user)) {
      import("../services/notifications.js").then(({ initNotificationBell }) => {
        initNotificationBell(user.id);
      });
    } else {
      const bell = document.getElementById("notificationBell");
      if (bell) bell.style.display = "none";
    }

    // Default filter to user's neighborhood
    if (user?.neighborhood) {
      currentNeighborhoodFilter = user.neighborhood;
      updateSectionTitle(user.neighborhood, lang);
      document.getElementById("showAllBtn").style.display = "inline-flex";
    }

    // Weather widget — non-blocking, loaded before map
    loadWeatherWidget(user);

    // Leaflet is bundled via npm — always available
    const map = initializeMap();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      ro.disconnect();
    });
    ro.observe(map.getContainer());
    await loadMapData(map);

    // Auto-complete any campaigns whose scheduled_date has passed (fire-and-forget)
    if (!isDemoUser(user)) {
      supabase
        .rpc("auto_complete_campaigns")
        .then()
        .catch((err) => logger.warn("auto_complete_campaigns RPC failed:", err));
    }

    await loadCampaignsPage(false);

    // Leaderboard — non-blocking, loads both tabs in parallel
    loadLeaderboard(user);
    loadUserLeaderboard(user);

    // Leaderboard tabs
    document.getElementById("lbNeighborhoodTab")?.addEventListener("click", () => {
      document.getElementById("leaderboardContainer").style.display = "";
      document.getElementById("userLeaderboardContainer").style.display = "none";
      document.getElementById("leaderboardTitle").setAttribute("data-i18n", "leaderboard.title");
      document.getElementById("leaderboardTitle").textContent = t("leaderboard.title");
      document.getElementById("lbNeighborhoodTab").classList.add("lb-tab--active");
      document.getElementById("lbNeighborhoodTab").setAttribute("aria-selected", "true");
      document.getElementById("lbUsersTab").classList.remove("lb-tab--active");
      document.getElementById("lbUsersTab").setAttribute("aria-selected", "false");
    });
    document.getElementById("lbUsersTab")?.addEventListener("click", () => {
      document.getElementById("leaderboardContainer").style.display = "none";
      document.getElementById("userLeaderboardContainer").style.display = "";
      document.getElementById("leaderboardTitle").textContent = t("leaderboard.userTitle");
      document.getElementById("lbUsersTab").classList.add("lb-tab--active");
      document.getElementById("lbUsersTab").setAttribute("aria-selected", "true");
      document.getElementById("lbNeighborhoodTab").classList.remove("lb-tab--active");
      document.getElementById("lbNeighborhoodTab").setAttribute("aria-selected", "false");
    });

    // Load More button
    document
      .getElementById("loadMoreBtn")
      ?.addEventListener("click", () => loadCampaignsPage(true));

    // Show All button (replaces inline onclick)
    document.getElementById("showAllBtn")?.addEventListener("click", showAllCampaigns);

    // Category filter buttons (event delegation, replaces inline onclick)
    document.getElementById("categoryFilter")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-category");
      if (btn) filterByCategory(btn);
    });

    // Search input — debounced 300ms
    let searchDebounce = null;
    document.getElementById("campaignSearchInput")?.addEventListener("input", (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentSearchTerm = e.target.value.trim();
        loadCampaignsPage(false);
      }, 300);
    });

    // Neighborhood dropdown
    document.getElementById("neighborhoodSelect")?.addEventListener("change", (e) => {
      currentNeighborhoodFilter = e.target.value || null;
      loadCampaignsPage(false);
    });

    // Logout button
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      try {
        await logout();
        removeUser();
        await showSuccessToast(t("auth.logoutSuccessTitle"), 1000);
        window.location.href = "/";
      } catch (error) {
        await handleError("logout", error, "Failed to logout. Please try again.");
      }
    });
  } catch (error) {
    console.error("[dashboard] init error:", error);
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) spinner.style.display = "none";
    const container = document.getElementById("campaignsContainer");
    if (container) {
      container.style.display = "grid";
      container.innerHTML = `<div class="col-12"><div class="alert alert-warning">${t("dashboard.loadError")}</div></div>`;
    }
  }
});

// localizeNeighborhood is imported from src/utils/neighborhoods.js

/**
 * Build a human-readable countdown label for a campaign's scheduled start.
 * Returns null if campaign has no date/time or has already started.
 */
function buildCountdownLabel(campaign, lang) {
  if (!campaign.scheduled_date || !campaign.start_time) return null;
  const timeStr = campaign.start_time.slice(0, 5); // "HH:MM"
  const startMs = new Date(`${campaign.scheduled_date}T${timeStr}:00`).getTime();
  const diffMs = startMs - Date.now();
  if (diffMs <= 0) return null; // already started or past

  const diffMins = diffMs / 60000;
  if (diffMins < 60) return t("dashboard.countdownSoon");

  const today = new Date();
  const start = new Date(`${campaign.scheduled_date}T00:00:00`);
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const dayDiff = Math.ceil((startMid - todayMid) / 86400000);

  if (dayDiff === 0) return t("dashboard.countdownToday").replace("{{time}}", timeStr);
  if (dayDiff === 1) return t("dashboard.countdownTomorrow").replace("{{time}}", timeStr);
  return t("dashboard.countdownDays").replace("{{d}}", dayDiff);
}

/**
 * Build HTML for a single campaign card
 * @param {Object} campaign
 * @param {number} rsvpCount - number of people who plan to attend
 */
function buildCampaignCard(campaign, rsvpCount = 0, currentLang = "bg") {
  let titleObj = campaign.title;
  if (typeof titleObj === "string") {
    try {
      titleObj = JSON.parse(titleObj);
    } catch {
      /* use as-is */
    }
  }
  const title =
    typeof titleObj === "object"
      ? titleObj[currentLang] || titleObj.bg || titleObj.en || "Untitled"
      : titleObj || "Untitled";

  const neighborhood =
    localizeNeighborhood(campaign.neighborhood, currentLang) || "Студентски град";

  // Build scheduled date/time label
  const scheduledLabel = formatScheduledDate(campaign, currentLang, "short");

  const creator = campaign.creator?.username || campaign.creator_username || "";

  const countdownLabel = buildCountdownLabel(campaign, currentLang);

  const CATEGORY_EMOJI = { park: "🌳", street: "🛣️", water: "💧", other: "📦" };
  const categoryEmoji = CATEGORY_EMOJI[campaign.category] || null;
  const categoryLabel = campaign.category
    ? t(
        `campaign.category${campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}`
      ) || campaign.category
    : null;
  const categoryBadge =
    categoryEmoji && categoryLabel
      ? `<span class="campaign-category-badge">${categoryEmoji} ${escapeHTML(categoryLabel)}</span>`
      : "";

  let spotsLeftBadge = "";
  if (campaign.max_participants) {
    const taken = campaign.participation_count || 0;
    const left = campaign.max_participants - taken;
    if (left <= 5 && left > 0) {
      const spotsLabel =
        left === 1 ? t("campaign.spotsLeft_one") || "място" : t("campaign.spotsLeft") || "места";
      spotsLeftBadge = `<span class="spots-left-badge">🔥 ${left} ${spotsLabel}</span>`;
    } else if (left <= 0) {
      spotsLeftBadge = `<span class="spots-left-badge spots-left-badge--full">${t("campaign.spotsFull") || "Няма места"}</span>`;
    }
  }

  return `
    <div class="campaign-card-wrapper">
      <div class="card campaign-card" tabindex="0" role="link" aria-label="${escapeHTML(title)}" data-href="/campaign/${campaign.id}">
        ${
          campaign.before_photo_url
            ? `<img src="${campaign.before_photo_url}" class="card-img-top js-campaign-img" loading="lazy" alt="${escapeHTML(title)}">`
            : `<div class="card-img-top bg-secondary" style="height:200px;display:flex;align-items:center;justify-content:center;"><span class="text-white">${t("dashboard.noPhoto")}</span></div>`
        }
        <div class="card-body d-flex flex-column">
          ${categoryBadge || spotsLeftBadge ? `<div class="mb-2">${categoryBadge}${spotsLeftBadge}</div>` : ""}
          <h5 class="card-title">${escapeHTML(title)}</h5>
          <p class="card-text text-muted mb-1"><small>📍 ${escapeHTML(neighborhood)}</small></p>
          ${scheduledLabel ? `<p class="card-text text-muted mb-1"><small>📅 ${escapeHTML(scheduledLabel)}</small></p>` : ""}
          ${countdownLabel ? `<p class="card-text mb-1"><small class="campaign-countdown">⏳ ${escapeHTML(countdownLabel)}</small></p>` : ""}
          ${creator ? `<p class="card-text text-muted mb-2"><small>👤 ${escapeHTML(creator)}</small></p>` : ""}
          ${rsvpCount > 0 ? `<p class="card-text text-muted mb-2"><small>🙋 ${t("dashboard.rsvpCount").replace("{{n}}", rsvpCount)}</small></p>` : ""}
          <a href="/campaign/${campaign.id}" class="btn btn-primary w-100">
            ${t("dashboard.viewCampaign") || "Преглед"}
          </a>
        </div>
      </div>
    </div>`;
}

const getImgFallbackHTML = () =>
  `<div class="card-img-top bg-secondary" style="height:200px;display:flex;align-items:center;justify-content:center;"><span class="text-white">${t("dashboard.noPhoto")}</span></div>`;

function wireImageFallbacks(container) {
  container.querySelectorAll("img.js-campaign-img").forEach((img) => {
    img.addEventListener(
      "error",
      function onImgError() {
        img.style.display = "none";
        img.insertAdjacentHTML("afterend", getImgFallbackHTML());
      },
      { once: true }
    );
  });
}

function wireCampaignCardNavigation(container) {
  container.querySelectorAll(".campaign-card[data-href]:not([data-wired])").forEach((card) => {
    card.dataset.wired = "true";
    const href = card.dataset.href;
    card.addEventListener("click", (e) => {
      // Don't double-navigate if the click was on the <a> button inside
      if (e.target.closest("a")) return;
      window.location.href = href;
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });
}

/**
 * Render the weather widget above the map.
 * In demo mode shows static data. If fetch fails, widget stays hidden.
 */
async function loadWeatherWidget(user) {
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;

  let weather;

  if (isDemoUser(user)) {
    weather = { temperature: 22, condition: "clear", icon: "☀️", isGoodWeather: true };
  } else {
    weather = await fetchWeather();
  }

  if (!weather) return; // API failed — stay hidden

  const msgKey =
    weather.condition === "clear" || weather.condition === "mostly_clear"
      ? "good"
      : weather.condition; // cloudy | fog | rain | snow | showers | storm

  const msg = t(`weather.${msgKey}`) || "";

  document.getElementById("weatherIcon").textContent = weather.icon;
  document.getElementById("weatherTemp").textContent = `${weather.temperature}°C`;
  document.getElementById("weatherMsg").textContent = msg ? `— ${msg}` : "";

  if (!weather.isGoodWeather) widget.classList.add("weather-warning");
  widget.style.display = "flex";
}

/**
 * Update Load More button visibility and counter
 */
function updateLoadMoreUI() {
  const container = document.getElementById("loadMoreContainer");
  const counter = document.getElementById("campaignsCounter");
  if (!container) return;

  const shown = currentOffset;
  const total = totalCount;

  if (shown >= total) {
    container.style.display = "none";
  } else {
    container.style.display = "block";
    if (counter) {
      counter.textContent =
        t("dashboard.showingOf")?.replace("{shown}", shown).replace("{total}", total) ||
        (localStorage.getItem("CLEAN_QUARTER_LANGUAGE") === "bg"
          ? `Показани ${shown} от ${total}`
          : `Showing ${shown} of ${total}`);
    }
  }
}

/**
 * Load and display campaigns with pagination
 */
async function loadCampaignsPage(append = false) {
  const loadingSpinnerId = "loadingSpinner";
  const campaignsContainerId = "campaignsContainer";
  const noCampaignsMessageId = "noCampaignsMessage";

  if (!append) {
    // Reset state for initial load
    currentOffset = 0;
    totalCount = 0;
    allDemoCampaigns = [];
  }

  try {
    if (!append) {
      showLoading(loadingSpinnerId, [campaignsContainerId, noCampaignsMessageId]);
    }

    let campaigns = [];
    const user = JSON.parse(localStorage.getItem("user"));

    if (isDemoUser(user)) {
      // Demo mode — load raw once, filter client-side on each reset
      if (!append) {
        rawDemoCampaigns = getDemoCampaigns();
        allDemoCampaigns = filterCampaigns(rawDemoCampaigns, {
          neighborhood: currentNeighborhoodFilter,
          category: currentCategoryFilter,
          searchTerm: currentSearchTerm,
        });
        totalCount = allDemoCampaigns.length;
      }
      campaigns = allDemoCampaigns.slice(currentOffset, currentOffset + PAGE_SIZE);
    } else {
      // Real mode — paginated Supabase query
      let query = supabase
        .from("campaigns")
        .select(
          "id, title, neighborhood, category, before_photo_url, status, created_at, scheduled_date, start_time, end_time, created_by, max_participants, participation_count, creator:profiles!created_by(username)",
          { count: "exact" }
        )
        .eq("status", "active");

      if (currentNeighborhoodFilter) {
        query = query.eq("neighborhood", currentNeighborhoodFilter);
      }

      if (currentCategoryFilter) {
        query = query.eq("category", currentCategoryFilter);
      }

      if (currentSearchTerm) {
        query = query.ilike("title", `%${currentSearchTerm}%`);
      }

      const { data, error, count } = await query
        .order("scheduled_date", { ascending: true })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (error) throw error;
      campaigns = data || [];
      totalCount = count ?? 0;
    }

    currentOffset += campaigns.length;

    if (!append) {
      hideLoading(loadingSpinnerId, {
        [campaignsContainerId]: "grid",
        [noCampaignsMessageId]: "none",
      });
    }

    if (!append && isEmpty(campaigns)) {
      document.getElementById(noCampaignsMessageId).style.display = "block";
      updateLoadMoreUI();
      return;
    }

    // Fetch RSVP counts for all loaded campaigns
    let rsvpCounts = {};
    if (isDemoUser(user)) {
      const allRsvps = getDemoRsvps();
      allRsvps.forEach((r) => {
        rsvpCounts[r.campaign_id] = (rsvpCounts[r.campaign_id] || 0) + 1;
      });
    } else if (campaigns.length) {
      rsvpCounts = await getRsvpCountsForCampaigns(campaigns.map((c) => c.id));
    }

    const campaignsContainer = document.getElementById(campaignsContainerId);
    const currentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    const html = campaigns
      .map((c) => buildCampaignCard(c, rsvpCounts[c.id] || 0, currentLang))
      .join("");

    if (append) {
      campaignsContainer.insertAdjacentHTML("beforeend", html);
    } else {
      campaignsContainer.innerHTML = html;
    }
    wireImageFallbacks(campaignsContainer);
    wireCampaignCardNavigation(campaignsContainer);

    updateLoadMoreUI();
  } catch (error) {
    if (!append) hideLoading(loadingSpinnerId);

    await handleError(
      "loadCampaignsPage",
      error,
      "Failed to load campaigns. Please try again later."
    );
    if (!append) {
      document.getElementById(campaignsContainerId).innerHTML =
        `<div class="col-12"><div class="alert alert-danger" role="alert">${t("dashboard.campaignsLoadError")}</div></div>`;
    }
  }
}

/**
 * Load admin banner with pending participations count
 */
async function loadAdminBanner() {
  try {
    const { count } = await supabase
      .from("participations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null);

    const banner = document.getElementById("adminBanner");
    const pendingEl = document.getElementById("pendingCount");
    if (banner && pendingEl) {
      pendingEl.textContent = count ?? 0;
      banner.style.display = "block";
    }
  } catch {
    // не показваме банера при грешка
  }
}

/**
 * Update campaigns section title to show active neighborhood filter
 */
function updateSectionTitle(neighborhood, lang) {
  const title = document.getElementById("campaignsSectionTitle");
  if (!title) return;
  const label = localizeNeighborhood(neighborhood, lang) || neighborhood;
  title.textContent = t("dashboard.cleanupsIn").replace("{{neighborhood}}", label);
}

/**
 * Remove neighborhood filter and reload all campaigns
 */
async function showAllCampaigns() {
  currentNeighborhoodFilter = null;

  const title = document.getElementById("campaignsSectionTitle");
  if (title) {
    title.setAttribute("data-i18n", "dashboard.nearYou");
    title.textContent = t("dashboard.nearYou");
  }

  document.getElementById("showAllBtn").style.display = "none";
  await loadCampaignsPage(false);
}

const MEDAL = ["🥇", "🥈", "🥉"];

/**
 * Load neighborhood leaderboard — groups profiles by neighborhood,
 * sums points and counts participants, renders top 5.
 * @param {Object|null} currentUser - logged-in user from localStorage
 */
async function loadLeaderboard(currentUser) {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  try {
    let rows;

    // Demo mode — build leaderboard from localStorage campaigns
    if (isDemoUser(currentUser)) {
      const demoCampaigns = getDemoCampaigns();
      const grouped = {};
      demoCampaigns.forEach((c) => {
        const n = c.neighborhood || "studentski_grad";
        if (!grouped[n]) grouped[n] = { neighborhood: n, total_points: 0, participant_count: 0 };
        grouped[n].total_points += CLEANUP_POINTS;
        grouped[n].participant_count += 1;
      });
      rows = Object.values(grouped).sort((a, b) => b.total_points - a.total_points);
    } else {
      // Use DB view for server-side aggregation — avoids fetching all profiles client-side
      const { data, error } = await supabase
        .from("neighborhood_leaderboard")
        .select("neighborhood, total_points, participant_count");

      if (error) throw error;

      rows = (data || []).sort((a, b) => b.total_points - a.total_points);
    }

    if (!rows.length) {
      container.innerHTML = `<p class="text-muted">${t("leaderboard.noData") || (lang === "en" ? "No data yet" : "Все още няма данни")}</p>`;
      return;
    }

    const userNeighborhood = currentUser?.neighborhood || null;
    const pointsLabel = t("leaderboard.points") || (lang === "en" ? "points" : "точки");
    const participantsLabel =
      t("leaderboard.participants") || (lang === "en" ? "participants" : "участника");
    const yourLabel =
      t("leaderboard.yourNeighborhood") || (lang === "en" ? "your neighborhood" : "твоят квартал");

    const cards = rows.slice(0, 5).map((row, i) => {
      const medal = MEDAL[i] || `${i + 1}.`;
      const name = localizeNeighborhood(row.neighborhood);
      const isYours = row.neighborhood === userNeighborhood;
      const maxPoints = rows[0].total_points || 1;
      const pct = Math.round((row.total_points / maxPoints) * 100);

      return `
        <div class="leaderboard-card${isYours ? " leaderboard-card--yours" : ""}">
          <div class="leaderboard-rank">${medal}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">
              ${escapeHTML(name)}
              ${isYours ? `<span class="leaderboard-badge">${yourLabel}</span>` : ""}
            </div>
            <div class="leaderboard-bar-wrap">
              <div class="leaderboard-bar" style="width:${pct}%"></div>
            </div>
            <div class="leaderboard-stats">
              <strong>${row.total_points}</strong> ${pointsLabel}
              &nbsp;·&nbsp;
              ${row.participant_count} ${participantsLabel}
            </div>
          </div>
        </div>`;
    });

    container.innerHTML = cards.join("");
  } catch (err) {
    // Leaderboard is non-critical — fail silently
    console.warn("[leaderboard] failed to load:", err.message);
  }
}

/**
 * Load individual user leaderboard — top 20 users by points_balance.
 * @param {Object|null} currentUser
 */
async function loadUserLeaderboard(currentUser) {
  const container = document.getElementById("userLeaderboardContainer");
  if (!container) return;

  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const pointsLabel = t("leaderboard.points") || "точки";
  const youLabel = t("leaderboard.you") || "ти";
  const noUsersMsg = t("leaderboard.noUsers") || "Все още няма класирани потребители";

  try {
    let rows;

    if (isDemoUser(currentUser)) {
      // Demo: build from demoUsers sorted by points
      const { getDemoUsers } = await import("../utils/demoMode.js");
      rows = getDemoUsers()
        .filter((u) => u.points_balance > 0 && u.username)
        .sort((a, b) => b.points_balance - a.points_balance)
        .slice(0, 20)
        .map((u) => ({
          id: u.id,
          username: u.username,
          neighborhood: u.neighborhood,
          total_points: u.points_balance,
        }));
    } else {
      const { data, error } = await supabase
        .from("user_leaderboard")
        .select("id, username, neighborhood, total_points")
        .limit(20);
      if (error) throw error;
      rows = data || [];
    }

    if (!rows.length) {
      container.innerHTML = `<p class="text-muted">${noUsersMsg}</p>`;
      return;
    }

    const maxPoints = rows[0].total_points || 1;
    const cards = rows.map((row, i) => {
      const medal = MEDAL[i] || `${i + 1}.`;
      const isYou = row.id === currentUser?.id;
      const pct = Math.round((row.total_points / maxPoints) * 100);
      const neighborhood = row.neighborhood
        ? ` · ${localizeNeighborhood(row.neighborhood, lang)}`
        : "";
      return `
        <div class="leaderboard-card${isYou ? " leaderboard-card--yours" : ""}">
          <div class="leaderboard-rank">${medal}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">
              ${escapeHTML(row.username)}
              ${isYou ? `<span class="leaderboard-badge">${youLabel}</span>` : ""}
              <span class="leaderboard-neighborhood">${escapeHTML(neighborhood)}</span>
            </div>
            <div class="leaderboard-bar-wrap">
              <div class="leaderboard-bar" style="width:${pct}%"></div>
            </div>
            <div class="leaderboard-stats">
              <strong>${row.total_points}</strong> ${pointsLabel}
            </div>
          </div>
        </div>`;
    });

    container.innerHTML = cards.join("");
  } catch (err) {
    console.warn("[user-leaderboard] failed to load:", err.message);
  }
}

/**
 * Filter campaigns by category
 */
async function filterByCategory(btn) {
  const category = btn.dataset.category || null;
  currentCategoryFilter = category;

  // Update active button state
  document.querySelectorAll(".btn-category").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  await loadCampaignsPage(false);
}
