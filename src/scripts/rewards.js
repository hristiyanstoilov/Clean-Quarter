import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import { escapeHTML, showSuccessToast, initSwalFallback, removeUser } from "../utils/helpers.js";
import { logout } from "../services/auth.js";
import {
  isDemoUser,
  getDemoRewards,
  saveDemoRewards,
  addDemoTransaction,
} from "../utils/demoMode.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";
import { initBottomNav } from "../hooks/index.js";
import { initPage } from "../utils/pageInit.js";

// Global variables
let currentUser = null;
let userProfile = null;
let rewards = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  initPage();
  initNetworkStatusBanner();
  initBottomNav();
  initSwalFallback();
  try {
    // Initialize i18n first (realTime = false)
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

    // Show admin nav if user is admin
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
    } else {
      const bell = document.getElementById("notificationBell");
      if (bell) bell.style.display = "none";
    }

    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });

    await checkAuth();
    await loadRewardsData();
  } catch {
    // silently ignore
  }
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  // Check for demo mode user first
  const localUser = localStorage.getItem("user");
  if (localUser) {
    try {
      currentUser = JSON.parse(localUser);
      return;
    } catch {
      // silently ignore
    }
  }

  // Check Supabase auth for real users
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

/**
 * Load rewards data and user profile
 */
async function loadRewardsData() {
  try {
    // Check if demo mode
    if (isDemoUser(currentUser)) {
      // Demo mode - use localStorage
      userProfile = currentUser;
      rewards = getDemoRewards();
    } else {
      // Real mode - fetch from Supabase
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points_balance")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }
      userProfile = profile;

      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .is("deleted_at", null)
        .order("cost", { ascending: true });

      if (rewardsError) {
        throw new Error(`Failed to fetch rewards: ${rewardsError.message}`);
      }
      rewards = rewardsData || [];
    }

    // Display user points
    document.getElementById("pointsBalance").textContent = userProfile.points_balance || 0;

    // Render rewards
    renderRewards();

    // Hide loading, show content
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("rewardsContent").style.display = "block";
  } catch (error) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = error.message || "Failed to load rewards. Please try again.";
    errorDiv.style.display = "block";

    document.getElementById("loadingState").style.display = "none";
    document.getElementById("rewardsContent").style.display = "block";
  }
}

/**
 * Render rewards as cards
 */
function renderRewards() {
  const container = document.getElementById("rewardsGrid");

  if (rewards.length === 0) {
    container.innerHTML = `
              <div style="grid-column: 1 / -1;">
                  <div class="empty-state">
                      <div class="empty-state-icon">🎁</div>
                      <h3>${t("rewards.noRewardsTitle")}</h3>
                      <p>${t("rewards.noRewardsText")}</p>
                  </div>
              </div>
          `;
    return;
  }

  let html = "";
  const currentPoints = userProfile.points_balance || 0;

  rewards.forEach((reward) => {
    const outOfStock = reward.quantity_available !== null && reward.quantity_available <= 0;
    const canAfford = currentPoints >= reward.cost && !outOfStock;
    const buttonClass = canAfford ? "btn-buy" : "btn-buy btn-buy-insufficient";
    const buttonText = outOfStock
      ? t("rewards.outOfStock")
      : canAfford
        ? t("rewards.buyBtn")
        : t("rewards.notEnoughPoints");
    const buttonDisabled = !canAfford ? "disabled" : "";

    const imageContent = reward.image_url
      ? `<img src="${escapeHTML(reward.image_url)}" alt="${escapeHTML(reward.title)}" style="max-width:100%;max-height:120px;object-fit:cover;border-radius:8px;">`
      : getRewardEmoji(reward.category);

    const stockLabel =
      reward.quantity_available !== null
        ? `<span class="reward-stock">${reward.quantity_available} ${t("rewards.left")}</span>`
        : "";

    html += `
              <div class="reward-card${outOfStock ? " reward-out-of-stock" : ""}">
                  <div class="reward-image">
                      ${imageContent}
                  </div>
                  <div class="reward-content">
                      <span class="reward-category">${escapeHTML(reward.category)} ${stockLabel}</span>
                      <h3 class="reward-title">${escapeHTML(reward.title)}</h3>
                      <p class="reward-description">${escapeHTML(reward.description)}</p>
                      <div class="reward-footer">
                          <div class="reward-cost">
                              <span class="icon">⭐</span>
                              <span>${reward.cost}</span>
                          </div>
                          <button
                              class="${buttonClass} js-buy-btn"
                              data-reward-id="${escapeHTML(reward.id)}"
                              data-reward-title="${escapeHTML(reward.title)}"
                              data-reward-cost="${Number(reward.cost)}"
                              ${buttonDisabled}
                              ${!canAfford ? 'aria-disabled="true"' : ""}
                          >
                              ${buttonText}
                          </button>
                      </div>
                  </div>
              </div>
          `;
  });

  container.innerHTML = html;

  // Attach buy handlers via event delegation (avoids inline onclick with user data)
  container.querySelectorAll(".js-buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleBuy(btn.dataset.rewardId, btn.dataset.rewardTitle, Number(btn.dataset.rewardCost));
    });
  });
}

/**
 * Get emoji based on reward category
 */
function getRewardEmoji(category) {
  const emojiMap = {
    discount: "🎟️",
    voucher: "🏷️",
    service: "🛠️",
    experience: "🎪",
    donation: "❤️",
    merchandise: "👕",
    partnership: "🤝",
    other: "🎁",
  };
  return emojiMap[category?.toLowerCase()] || "🎁";
}

/**
 * Handle reward purchase
 */
async function handleBuy(rewardId, rewardTitle, rewardCost) {
  try {
    const shortage = rewardCost - (userProfile.points_balance || 0);

    // Check if user has enough points
    if (shortage > 0) {
      await Swal.fire({
        icon: "error",
        title: t("rewards.insufficientPointsTitle"),
        text: t("rewards.insufficientPointsText").replace("{{n}}", shortage),
      });
      return;
    }

    // Show confirmation
    const result = await Swal.fire({
      title: t("rewards.confirmPurchaseTitle"),
      html: `<strong>${rewardTitle}</strong><br>${t("rewards.cost")}: <strong>${rewardCost} ⭐</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("rewards.confirmBuy"),
      cancelButtonText: t("common.cancel"),
    });

    if (!result.isConfirmed) {
      return;
    }

    // Show loading (no await — fire-and-close pattern to avoid deadlock)
    Swal.fire({
      title: t("rewards.processingTitle"),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Compute expected balance locally (used as fallback; real mode re-fetches from server below)
    let newPointsBalance = (userProfile.points_balance || 0) - rewardCost;

    const isDemo = isDemoUser(currentUser);

    if (isDemo) {
      // Demo mode: update localStorage instead of Supabase
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      savedUser.points_balance = newPointsBalance;
      localStorage.setItem("user", JSON.stringify(savedUser));

      // Update demo rewards quantity in localStorage
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward && reward.quantity_available !== null) {
        reward.quantity_available -= 1;
        saveDemoRewards(rewards);
      }

      // Add demo transaction to localStorage
      addDemoTransaction({
        id: `trans-${Date.now()}`,
        user_id: currentUser.id,
        amount: -rewardCost,
        type: "spent",
        description: `Purchased reward: ${rewardTitle}`,
        reward_id: rewardId,
        created_at: new Date().toISOString(),
      });
    } else {
      // Atomic purchase via SECURITY DEFINER RPC:
      // validates points, deducts balance, decrements stock, inserts transaction.
      const { data: result, error: rpcError } = await supabase.rpc("purchase_reward", {
        p_reward_id: rewardId,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }
      if (!result.success) {
        throw new Error(result.error || "Purchase failed");
      }

      // Update local reward quantity
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward && reward.quantity_available !== null) {
        reward.quantity_available -= 1;
      }

      // Re-fetch authoritative balance from server — local computation can be
      // stale if points were credited concurrently (e.g. admin approval in flight).
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("points_balance")
        .eq("id", currentUser.id)
        .single();
      if (freshProfile != null) {
        newPointsBalance = freshProfile.points_balance;
      }
    }

    // Update user profile points
    userProfile.points_balance = newPointsBalance;

    Swal.close();

    await showSuccessToast(
      t("rewards.purchaseSuccess")
        .replace("{{title}}", rewardTitle)
        .replace("{{balance}}", newPointsBalance)
    );

    // Reload rewards
    document.getElementById("pointsBalance").textContent = newPointsBalance;
    renderRewards();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("rewards.purchaseError"),
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await logout();
    removeUser();
    await showSuccessToast(t("auth.logoutSuccessTitle"), 1000);
    window.location.href = "/";
  } catch {
    // silently ignore
  }
}

// --- Test exports (tree-shaken in production builds) ---
export { handleBuy };
export const _setCurrentUser = (u) => {
  currentUser = u;
};
export const _setUserProfile = (p) => {
  userProfile = p;
};
export const _setRewards = (r) => {
  rewards = r;
};
