import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, setLanguage } from "../utils/i18n.js";
import { escapeHTML, showSuccessToast } from "../utils/helpers.js";

// Global variables
let currentUser = null;
let userProfile = null;
let rewards = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize i18n first (realTime = false)
    await initI18n(false);
    applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");

    // Language selector
    document.getElementById("languageSelector").value =
      localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    document.getElementById("languageSelector").addEventListener("change", (e) => {
      // Just show a message - language changes only from profile page
    });

    await checkAuth();
    await loadRewardsData();
  } catch (error) {
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
    } catch (e) {
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
    if (currentUser && currentUser.id === "demo-admin-001") {
      // Demo mode - use localStorage
      userProfile = currentUser;
      rewards = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_REWARDS") || "[]");
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
                      <h3>No Rewards Available</h3>
                      <p>Rewards will be added soon. Come back later!</p>
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
    const buttonText = outOfStock ? "Out of Stock" : canAfford ? "✓ Buy" : "✗ Not Enough Points";
    const buttonDisabled = !canAfford ? "disabled" : "";

    const imageContent = reward.image_url
      ? `<img src="${escapeHTML(reward.image_url)}" alt="${escapeHTML(reward.title)}" style="max-width:100%;max-height:120px;object-fit:cover;border-radius:8px;">`
      : getRewardEmoji(reward.category);

    const stockLabel =
      reward.quantity_available !== null
        ? `<span class="reward-stock">${reward.quantity_available} left</span>`
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
    // Check if user has enough points
    if ((userProfile.points_balance || 0) < rewardCost) {
      await Swal.fire({
        icon: "error",
        title: "Insufficient Points",
        text: `You need ${rewardCost - (userProfile.points_balance || 0)} more points to buy this reward.`,
      });
      return;
    }

    // Show confirmation
    const result = await Swal.fire({
      title: "Confirm Purchase?",
      html: `<strong>${rewardTitle}</strong><br>Cost: <strong>${rewardCost} ⭐</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Buy It!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    // Show loading
    await Swal.fire({
      title: "Processing...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Deduct points from user
    const newPointsBalance = (userProfile.points_balance || 0) - rewardCost;

    const isDemo = currentUser && currentUser.id === "demo-admin-001";

    if (isDemo) {
      // Demo mode: update localStorage instead of Supabase
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      savedUser.points_balance = newPointsBalance;
      localStorage.setItem("user", JSON.stringify(savedUser));

      // Update demo rewards quantity in localStorage
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward && reward.quantity_available !== null) {
        reward.quantity_available -= 1;
        localStorage.setItem("CLEAN_QUARTER_DEMO_REWARDS", JSON.stringify(rewards));
      }

      // Add demo transaction to localStorage
      const transactions = JSON.parse(
        localStorage.getItem("CLEAN_QUARTER_DEMO_TRANSACTIONS") || "[]"
      );
      transactions.push({
        id: `trans-${Date.now()}`,
        user_id: currentUser.id,
        amount: -rewardCost,
        type: "spent",
        description: `Purchased reward: ${rewardTitle}`,
        reward_id: rewardId,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("CLEAN_QUARTER_DEMO_TRANSACTIONS", JSON.stringify(transactions));
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
    }

    // Update user profile points
    userProfile.points_balance = newPointsBalance;

    Swal.close();

    await showSuccessToast(`${rewardTitle} purchased! Balance: ${newPointsBalance} ⭐`);

    // Update local state
    userProfile.points_balance = newPointsBalance;

    // Reload rewards
    document.getElementById("pointsBalance").textContent = newPointsBalance;
    renderRewards();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "Failed to purchase reward. Please try again.",
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}

// Expose functions to window for onclick handlers
window.handleLogout = handleLogout;
window.handleBuy = handleBuy;
