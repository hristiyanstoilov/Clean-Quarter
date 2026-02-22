import { initializeMap, loadMapData } from "../services/map.js";
import { logout } from "../services/auth.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import supabase from "../services/supabase.js";
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

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize i18n first (realTime = false)
    await initI18n(false);
    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    applyLanguage(lang);

    // Language selector
    document.getElementById("languageSelector").value = lang;
    document.getElementById("languageSelector").addEventListener("change", (e) => {
      setLanguage(e.target.value, true);
      location.reload();
    });

    // Require authentication
    requireAuth("/");

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
    // silently ignore
  }
});

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

  let neighborhoodObj = campaign.neighborhood;
  if (typeof neighborhoodObj === "string") {
    try {
      neighborhoodObj = JSON.parse(neighborhoodObj);
    } catch (e) {
      /* use as-is */
    }
  }
  const neighborhood =
    typeof neighborhoodObj === "object"
      ? neighborhoodObj[currentLang] || neighborhoodObj.bg || neighborhoodObj.en || ""
      : neighborhoodObj || "Студентски град";

  const createdDate = campaign.created_at
    ? new Date(campaign.created_at).toLocaleDateString(currentLang === "bg" ? "bg-BG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const creator = campaign.creator?.username || campaign.creator_username || "";

  return `
    <div class="campaign-card-wrapper">
      <div class="card campaign-card">
        ${
          campaign.before_photo_url
            ? `<img src="${campaign.before_photo_url}" class="card-img-top" alt="${escapeHTML(title)}">`
            : '<div class="card-img-top bg-secondary" style="height:200px;display:flex;align-items:center;justify-content:center;"><span class="text-white">Няма снимка</span></div>'
        }
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHTML(title)}</h5>
          <p class="card-text text-muted mb-1"><small>📍 ${escapeHTML(neighborhood)}</small></p>
          ${createdDate ? `<p class="card-text text-muted mb-1"><small>📅 ${createdDate}</small></p>` : ""}
          ${creator ? `<p class="card-text text-muted mb-2"><small>👤 ${escapeHTML(creator)}</small></p>` : ""}
          <div class="mt-auto">
            <a href="/campaign/${campaign.id}" class="btn btn-primary w-100">
              ${t("dashboard.viewCampaign") || "Преглед"}
            </a>
          </div>
        </div>
      </div>
    </div>`;
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
      // Demo mode — load all once, then slice
      if (!append) {
        allDemoCampaigns = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_CAMPAIGNS") || "[]");
        totalCount = allDemoCampaigns.length;
      }
      campaigns = allDemoCampaigns.slice(currentOffset, currentOffset + PAGE_SIZE);
    } else {
      // Real mode — paginated Supabase query
      const { data, error, count } = await supabase
        .from("campaigns")
        .select(
          "id, title, neighborhood, before_photo_url, status, created_at, created_by, creator:profiles!created_by(username)",
          { count: "exact" }
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
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
