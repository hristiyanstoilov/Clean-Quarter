import { initializeMap, loadMapData } from "../services/map.js";
import { logout } from "../services/auth.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
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
} from "../utils/helpers.js";

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

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
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

    // Role-based UI
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role === "admin") {
      document.getElementById("adminNavItem").style.display = "block";
      loadAdminBanner();
    }

    // Notification bell (skip demo users)
    if (user?.id && user.id !== "demo-admin-001") {
      import("../services/notifications.js").then(({ initNotificationBell }) => {
        initNotificationBell(user.id);
      });
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
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
    await loadMapData(map);

    await loadCampaignsPage(false);

    // Load More button
    document
      .getElementById("loadMoreBtn")
      ?.addEventListener("click", () => loadCampaignsPage(true));
  } catch (error) {
    console.error("[dashboard] init error:", error);
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) spinner.style.display = "none";
    const container = document.getElementById("campaignsContainer");
    if (container) {
      container.style.display = "grid";
      container.innerHTML =
        '<div class="col-12"><div class="alert alert-warning">Грешка при зареждане. Опресни страницата.</div></div>';
    }
  }
});

// Maps DB neighborhood keys → i18n keys for localized display
const NEIGHBORHOOD_I18N = {
  Darvenitsa: "darvenitsa",
  "Studentski Grad": "studentskiGrad",
  "Vitosha (VEC)": "vitoshaVec",
  "Malinova Dolina": "malinovaDolina",
  Musagenitsa: "musagenitsa",
};

/**
 * Translate a raw DB neighborhood value to the current language label.
 */
function localizeNeighborhood(raw, lang) {
  if (!raw) return "";
  // Already a JSON object with bg/en keys
  if (typeof raw === "object") return raw[lang] || raw.bg || raw.en || raw;
  // Try JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object") return parsed[lang] || parsed.bg || parsed.en || raw;
  } catch (e) {
    /* plain string */
  }
  // Plain string key — look up i18n
  const i18nKey = NEIGHBORHOOD_I18N[raw];
  if (i18nKey) return t(`neighborhoods.${i18nKey}`) || raw;
  return raw;
}

/**
 * Build HTML for a single campaign card
 */
function buildCampaignCard(campaign) {
  const currentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  let titleObj = campaign.title;
  if (typeof titleObj === "string") {
    try {
      titleObj = JSON.parse(titleObj);
    } catch (e) {
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
  let scheduledLabel = "";
  if (campaign.scheduled_date && campaign.start_time) {
    const [yr, mo, dy] = campaign.scheduled_date.split("-");
    const locale = currentLang === "bg" ? "bg-BG" : "en-US";
    const dateFmt = new Date(+yr, +mo - 1, +dy).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
    const startFmt = campaign.start_time.slice(0, 5);
    scheduledLabel = campaign.end_time
      ? `${dateFmt} · ${startFmt} – ${campaign.end_time.slice(0, 5)}`
      : `${dateFmt} · ${startFmt}`;
  }

  const creator = campaign.creator?.username || campaign.creator_username || "";

  return `
    <div class="campaign-card-wrapper">
      <div class="card campaign-card">
        ${
          campaign.before_photo_url
            ? `<img src="${campaign.before_photo_url}" class="card-img-top" alt="${escapeHTML(title)}" onerror="this.outerHTML='<div class=\\'card-img-top bg-secondary\\' style=\\'height:200px;display:flex;align-items:center;justify-content:center;\\'><span class=\\'text-white\\'>Няма снимка</span></div>'">`
            : '<div class="card-img-top bg-secondary" style="height:200px;display:flex;align-items:center;justify-content:center;"><span class="text-white">Няма снимка</span></div>'
        }
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHTML(title)}</h5>
          <p class="card-text text-muted mb-1"><small>📍 ${escapeHTML(neighborhood)}</small></p>
          ${scheduledLabel ? `<p class="card-text text-muted mb-1"><small>📅 ${escapeHTML(scheduledLabel)}</small></p>` : ""}
          ${creator ? `<p class="card-text text-muted mb-2"><small>👤 ${escapeHTML(creator)}</small></p>` : ""}
          <a href="/campaign/${campaign.id}" class="btn btn-primary w-100">
            ${t("dashboard.viewCampaign") || "Преглед"}
          </a>
        </div>
      </div>
    </div>`;
}

/**
 * Render the weather widget above the map.
 * In demo mode shows static data. If fetch fails, widget stays hidden.
 */
async function loadWeatherWidget(user) {
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;

  let weather;

  if (user?.id === "demo-admin-001") {
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

    if (user && user.id === "demo-admin-001") {
      // Demo mode — load raw once, filter client-side on each reset
      if (!append) {
        rawDemoCampaigns = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_CAMPAIGNS") || "[]");
        let filtered = rawDemoCampaigns;
        if (currentNeighborhoodFilter) {
          filtered = filtered.filter((c) => c.neighborhood === currentNeighborhoodFilter);
        }
        if (currentCategoryFilter) {
          filtered = filtered.filter((c) => c.category === currentCategoryFilter);
        }
        allDemoCampaigns = filtered;
        totalCount = allDemoCampaigns.length;
      }
      campaigns = allDemoCampaigns.slice(currentOffset, currentOffset + PAGE_SIZE);
    } else {
      // Real mode — paginated Supabase query
      let query = supabase
        .from("campaigns")
        .select(
          "id, title, neighborhood, category, before_photo_url, status, created_at, scheduled_date, start_time, end_time, created_by, creator:profiles!created_by(username)",
          { count: "exact" }
        )
        .eq("status", "active");

      if (currentNeighborhoodFilter) {
        query = query.eq("neighborhood", currentNeighborhoodFilter);
      }

      if (currentCategoryFilter) {
        query = query.eq("category", currentCategoryFilter);
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

    const campaignsContainer = document.getElementById(campaignsContainerId);
    const html = campaigns.map(buildCampaignCard).join("");

    if (append) {
      campaignsContainer.insertAdjacentHTML("beforeend", html);
    } else {
      campaignsContainer.innerHTML = html;
    }

    updateLoadMoreUI();
  } catch (error) {
    if (!append) hideLoading(loadingSpinnerId);

    await handleError(
      "loadCampaignsPage",
      error,
      "Failed to load campaigns. Please try again later."
    );
    if (!append) {
      document.getElementById(campaignsContainerId).innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            Грешка при зареждане на кампаниите. Опитайте отново по-късно.
          </div>
        </div>`;
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
  } catch (e) {
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
  title.textContent = lang === "en" ? `Cleanups in ${label}` : `Почистване в ${label}`;
}

/**
 * Remove neighborhood filter and reload all campaigns
 */
window.showAllCampaigns = async function () {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  currentNeighborhoodFilter = null;

  const title = document.getElementById("campaignsSectionTitle");
  if (title) {
    title.setAttribute("data-i18n", "dashboard.nearYou");
    title.textContent = lang === "en" ? "Cleanups near you" : "Почистване в близост до вас";
  }

  document.getElementById("showAllBtn").style.display = "none";
  await loadCampaignsPage(false);
};

/**
 * Filter campaigns by category
 */
window.filterByCategory = async function (btn) {
  const category = btn.dataset.category || null;
  currentCategoryFilter = category;

  // Update active button state
  document.querySelectorAll(".btn-category").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  await loadCampaignsPage(false);
};

/**
 * Handle logout
 */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await logout();
    removeUser();

    window.location.href = "/";
  } catch (error) {
    await handleError("logout", error, "Failed to logout. Please try again.");
  }
});
