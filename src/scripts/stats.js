import { initI18n, applyLanguage, t } from "../utils/i18n.js";
import { escapeHTML } from "../utils/helpers.js";
import { getPublicStats, getNeighborhoodStats, getCategoryStats } from "../services/stats.js";
import { initPage } from "../utils/pageInit.js";

const CATEGORY_CONFIG = {
  park: { icon: "🌳", cls: "cat-park" },
  street: { icon: "🛣️", cls: "cat-street" },
  water: { icon: "💧", cls: "cat-water" },
  other: { icon: "📦", cls: "cat-other" },
};

const RANK_CLS = ["rank-1", "rank-2", "rank-3"];

document.addEventListener("DOMContentLoaded", async () => {
  initPage();
  await initI18n(false);
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
  await loadStats();
});

async function loadStats() {
  try {
    const [stats, neighborhoods, categories] = await Promise.all([
      getPublicStats(),
      getNeighborhoodStats(),
      getCategoryStats(),
    ]);

    renderStatCards(stats);
    renderNeighborhoods(neighborhoods);
    renderCategories(categories);

    document.getElementById("loadingState").style.display = "none";
    document.getElementById("statsContent").style.display = "block";
  } catch (err) {
    console.error("[stats] Failed to load public stats:", err);
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "block";
  }
}

function renderStatCards(stats) {
  document.getElementById("statCampaigns").textContent = formatNumber(stats.total_campaigns);
  document.getElementById("statVolunteers").textContent = formatNumber(stats.total_volunteers);
  document.getElementById("statCleanups").textContent = formatNumber(stats.total_cleanups);
  document.getElementById("statPoints").textContent = formatNumber(stats.total_points);
}

function renderNeighborhoods(neighborhoods) {
  const container = document.getElementById("neighborhoodList");
  if (!neighborhoods.length) return;

  container.innerHTML = neighborhoods
    .map((n, i) => {
      const rankCls = RANK_CLS[i] ?? "rank-other";
      const participantsLabel = t("leaderboard.participants") || "participants";
      return `
        <div class="leaderboard-row">
          <div class="leaderboard-rank ${rankCls}">${i + 1}</div>
          <div class="leaderboard-name">${escapeHTML(n.neighborhood)}</div>
          <div class="text-end">
            <div class="leaderboard-points">${formatNumber(n.total_points)} ${t("leaderboard.points") || "pts"}</div>
            <div class="leaderboard-participants">${formatNumber(n.participant_count)} ${participantsLabel}</div>
          </div>
        </div>`;
    })
    .join("");
}

function renderCategories(categories) {
  const container = document.getElementById("categoryList");
  if (!categories.length) return;

  container.innerHTML =
    '<div class="d-flex flex-wrap gap-1 mt-1">' +
    categories
      .map((c) => {
        const cfg = CATEGORY_CONFIG[c.category] ?? CATEGORY_CONFIG.other;
        const label = t(`campaign.category${capitalize(c.category)}`) || c.category;
        return `<span class="category-badge ${cfg.cls}">${cfg.icon} ${escapeHTML(label)} <strong>${c.campaign_count}</strong></span>`;
      })
      .join("") +
    "</div>";
}

function formatNumber(n) {
  if (n === null || n === undefined) return "0";
  return Number(n).toLocaleString();
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
