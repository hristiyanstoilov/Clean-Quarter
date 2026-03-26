import supabase from "../services/supabase.js";
import { uploadAvatar } from "../services/storage.js";
import { compressImage } from "../services/compressor.js";
import { getAvatarUrl } from "../services/avatars.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import {
  escapeHTML,
  showSuccessToast,
  removeUser,
  initSwalFallback,
  applyPasswordChecklist,
} from "../utils/helpers.js";
import { logout } from "../services/auth.js";
import { rules } from "../services/validation.js";
import {
  isDemoUser,
  getDemoTransactions,
  getDemoParticipations,
  getDemoCampaigns,
} from "../utils/demoMode.js";
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/pushNotifications.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";
import { initBottomNav } from "../hooks/index.js";
import { initPage } from "../utils/pageInit.js";
import { generateImpactCard } from "../services/impactCard.js";
// Global variables
let currentUser = null;
let userProfile = null;
let avatarFile = null;
let approvedCleanupCount = 0;

/**
 * Handle password recovery flow — triggered when user arrives via reset email link.
 * Supabase appends #type=recovery&access_token=... to the redirect URL.
 * Returns true if recovery was handled (page should stop further init).
 */
async function handlePasswordRecovery() {
  const hash = new URLSearchParams(window.location.hash.substring(1));
  if (hash.get("type") !== "recovery") return false;

  // Clear hash immediately so a page refresh doesn't re-trigger the flow
  history.replaceState(null, "", window.location.pathname);

  // Check for expired token — Supabase sets error_code in hash when token is invalid
  if (hash.get("error_code") === "otp_expired" || hash.get("error")) {
    await Swal.fire({
      icon: "error",
      title: t("auth.resetInvalidTitle"),
      text: t("auth.resetInvalidText"),
      confirmButtonColor: "#28a745",
    });
    window.location.href = "/";
    return true;
  }

  const { value: newPassword } = await Swal.fire({
    title: t("profile.newPassword"),
    html:
      `<p>${t("profile.newPassword")}:</p>` +
      `<input type="password" id="recoveryPassword" class="swal2-input" placeholder="${t("auth.newPasswordPlaceholderFull")}">`,
    icon: "info",
    confirmButtonColor: "#28a745",
    confirmButtonText: t("auth.savePasswordBtn"),
    showCancelButton: false,
    allowOutsideClick: false,
    preConfirm: () => {
      const pw = document.getElementById("recoveryPassword").value;
      const pwError = rules.password(pw);
      if (pwError) {
        Swal.showValidationMessage(pwError);
        return false;
      }
      return pw;
    },
  });

  if (!newPassword) return true;

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("auth.passwordChangeFailed"),
    });
  } else {
    await Swal.fire({
      icon: "success",
      title: t("auth.passwordChanged"),
      text: t("auth.passwordChangedText"),
      confirmButtonColor: "#28a745",
      timer: 3000,
      timerProgressBar: true,
    });
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return true;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  initPage();
  initNetworkStatusBanner();
  initBottomNav();
  initSwalFallback();

  // Handle password recovery before anything else — exits early if recovery link detected
  if (await handlePasswordRecovery()) return;
  // Password input and related elements (declare once)
  const passwordInput = document.getElementById("editPassword");
  const strengthBar = document.getElementById("editPasswordStrength");
  const toggleBtn = document.getElementById("toggleEditPassword");
  const eyeIcon = document.getElementById("editPasswordEye");

  // Password strength meter for profile
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener("input", function (e) {
      const value = e.target.value;
      let score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[a-z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      // Strength bar logic
      let percent = (score / 4) * 100;
      strengthBar.style.width = percent + "%";
      if (score === 4) {
        strengthBar.style.backgroundColor = "#28a745";
      } else if (score === 3) {
        strengthBar.style.backgroundColor = "#ffc107";
      } else {
        strengthBar.style.backgroundColor = "#dc3545";
      }
    });
  }

  // Password visibility toggle for profile
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", function () {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.textContent = "🙈";
      } else {
        passwordInput.type = "password";
        eyeIcon.textContent = "👁️";
      }
    });
  }
  try {
    // Initialize i18n first (realTime = false for initial load)
    await initI18n(false);
    applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");

    // Language selector - ENABLE REAL-TIME FOR PROFILE
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

    // Wire up button event listeners (replaces inline onclick in HTML)
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
    document.getElementById("editProfileBtn")?.addEventListener("click", toggleEditMode);
    document.getElementById("cancelEditBtn")?.addEventListener("click", toggleEditMode);
    document.getElementById("pushToggleBtn")?.addEventListener("click", handlePushToggle);
    document.getElementById("shareImpactBtn")?.addEventListener("click", handleShareImpact);

    await checkAuth();
    await loadProfileData();

    // Live password validation
    applyPasswordChecklist(passwordInput, {
      length: "edit-pw-length",
      uppercase: "edit-pw-uppercase",
      lowercase: "edit-pw-lowercase",
      digit: "edit-pw-digit",
    });
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
 * Load profile data and transactions
 */
async function loadProfileData() {
  try {
    let profile;

    // Check if in demo mode
    if (isDemoUser(currentUser)) {
      profile = currentUser;
    } else {
      // Fetch user profile from Supabase
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }
      profile = data;
    }

    userProfile = profile;

    // Display avatar
    displayAvatar(getAvatarUrl(userProfile));

    // Display profile info
    document.getElementById("userEmail").textContent = currentUser.email || currentUser.username;
    document.getElementById("emailValue").textContent = currentUser.email || currentUser.username;
    document.getElementById("neighborhoodDisplay").textContent =
      userProfile.neighborhood || t("profile.notSet");
    document.getElementById("neighborhoodValue").textContent =
      userProfile.neighborhood || t("profile.notSet");
    document.getElementById("pointsDisplay").textContent =
      (userProfile.points_balance || 0) + " ⭐";
    document.getElementById("pointsValue").textContent = userProfile.points_balance || 0;

    // Display rank
    displayRank(userProfile.points_balance || 0);

    // Display streak
    displayStreak(userProfile);

    // Load transactions, participations and badges in parallel
    await Promise.all([loadTransactions(), loadParticipations(), loadBadges()]);

    // Show content
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("profileContent").style.display = "block";

    // Init push notifications UI (non-blocking)
    initPushUI();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("profile.loadError"),
    });

    document.getElementById("loadingState").style.display = "none";
  }
}

/**
 * Display rank based on points
 */
function displayRank(points) {
  let rank, rankText, emoji;

  if (points < 50) {
    rank = "bronze";
    rankText = t("profile.rankBronze");
    emoji = "🥉";
  } else if (points < 100) {
    rank = "silver";
    rankText = t("profile.rankSilver");
    emoji = "🥈";
  } else {
    rank = "gold";
    rankText = t("profile.rankGold");
    emoji = "🥇";
  }

  const rankBadge = document.getElementById("rankBadge");
  rankBadge.className = `rank-badge rank-${rank}`;
  rankBadge.innerHTML = `<span>${emoji}</span> ${rankText} (${points} ⭐)`;

  document.getElementById("rankValue").textContent =
    `${rankText} - ${points} ${t("profile.pointsLabel")}`;

  // Rank progression bar
  const wrap = document.getElementById("rankProgressWrap");
  const fill = document.getElementById("rankProgressFill");
  const label = document.getElementById("rankProgressLabel");
  if (wrap && fill && label) {
    if (rank === "bronze") {
      const pct = Math.min((points / 50) * 100, 100);
      fill.style.width = `${pct}%`;
      label.textContent = t("profile.rankProgressToSilver").replace("{{n}}", 50 - points);
      wrap.style.display = "block";
    } else if (rank === "silver") {
      const pct = Math.min(((points - 50) / 50) * 100, 100);
      fill.style.width = `${pct}%`;
      label.textContent = t("profile.rankProgressToGold").replace("{{n}}", 100 - points);
      wrap.style.display = "block";
    } else {
      fill.style.width = "100%";
      label.textContent = t("profile.rankProgressMax");
      wrap.style.display = "block";
    }
  }
}

/**
 * Display streak stats
 */
function displayStreak(profile) {
  const current = profile.current_streak || 0;
  const longest = profile.longest_streak || 0;
  // Hide section entirely for users who have never completed a cleanup (both counters at 0).
  // A user with longest > 0 but current = 0 (broken streak) still sees their best record.
  if (current === 0 && longest === 0) return;
  const section = document.getElementById("streakSection");
  if (section) {
    document.getElementById("currentStreakValue").textContent = `🔥 ${current}`;
    document.getElementById("longestStreakValue").textContent = `🏆 ${longest}`;
    section.style.display = "block";
  }
}

/**
 * Load and display user achievement badges
 */
async function loadBadges() {
  const section = document.getElementById("badgesSection");
  const grid = document.getElementById("badgesGrid");
  if (!section || !grid) return;

  if (isDemoUser(currentUser)) return; // no badges in demo mode

  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        "badge_id, awarded_at, badges(emoji, name_bg, name_en, description_bg, description_en)"
      )
      .eq("user_id", currentUser.id)
      .order("awarded_at", { ascending: true });

    if (error) return; // silently ignore network/RLS errors

    if (!data || data.length === 0) {
      grid.innerHTML = `<p class="text-muted small">${t("profile.noBadgesYet") || "Все още няма постижения. Участвай в почистване, за да спечелиш!"}</p>`;
      section.style.display = "block";
      return;
    }

    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    grid.innerHTML = data
      .map((ub) => {
        const b = ub.badges;
        const name = lang === "en" ? b.name_en : b.name_bg;
        const desc = lang === "en" ? b.description_en : b.description_bg;
        return `<div class="badge-chip" title="${escapeHTML(desc || "")}">
          <span class="badge-emoji">${escapeHTML(b.emoji)}</span>
          <span class="badge-name">${escapeHTML(name)}</span>
        </div>`;
      })
      .join("");
    section.style.display = "block";
  } catch {
    // silently ignore — badges are non-critical
  }
}

/**
 * Load and display transactions
 */
async function loadTransactions() {
  try {
    let transactions = [];

    // Check if in demo mode
    if (isDemoUser(currentUser)) {
      transactions = getDemoTransactions();
    } else {
      const { data, error } = await supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      transactions = data || [];
    }

    if (!transactions || transactions.length === 0) {
      document.getElementById("transactionsContainer").innerHTML = `
                  <div class="empty-state">
                      <div class="empty-state-icon">📊</div>
                      <p>${t("profile.noTransactionsYet")}</p>
                  </div>
              `;
      return;
    }

    const txLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    const txLocale = txLang === "bg" ? "bg-BG" : "en-US";
    let html = `
              <div class="table-container">
                  <table class="table">
                      <thead>
                          <tr>
                              <th>${t("profile.date")}</th>
                              <th>${t("profile.type")}</th>
                              <th>${t("profile.amount")}</th>
                              <th>${t("profile.reason")}</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString(txLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const typeBadge =
        transaction.type === "earned"
          ? `<span class="badge-earned">${t("profile.earned")}</span>`
          : `<span class="badge-spent">${t("profile.spent")}</span>`;

      const amount =
        transaction.type === "earned"
          ? `<span class="amount-positive">+${transaction.amount}</span>`
          : `<span class="amount-negative">${transaction.amount}</span>`;

      html += `
                  <tr>
                      <td>${date}</td>
                      <td>${typeBadge}</td>
                      <td>${amount} ⭐</td>
                      <td>${escapeHTML(transaction.reason)}</td>
                  </tr>
              `;
    });

    html += `
                      </tbody>
                  </table>
              </div>
          `;

    document.getElementById("transactionsContainer").innerHTML = html;
  } catch {
    document.getElementById("transactionsContainer").innerHTML = `
              <div class="empty-state" style="color: #dc3545;">
                  <p>${t("profile.loadTransactionsError")}</p>
              </div>
          `;
  }
}

/**
 * Load and display user participations
 */
async function loadParticipations() {
  try {
    // Demo mode — no real participations in DB
    if (isDemoUser(currentUser)) {
      const demoParts = getDemoParticipations();
      const demoCampaigns = getDemoCampaigns();
      // Enrich with campaign data
      const enriched = demoParts.map((p) => ({
        ...p,
        campaigns: demoCampaigns.find((c) => c.id === p.campaign_id) || null,
      }));
      if (!enriched.length) {
        document.getElementById("participationsContainer").innerHTML = `
                  <div class="empty-state">
                      <div class="empty-state-icon">🎪</div>
                      <p>${t("profile.notJoinedYet")}</p>
                      <a href="/dashboard" style="color: #28a745; text-decoration: none; font-weight: bold;">${t("profile.viewCampaigns") || "View Campaigns →"}</a>
                  </div>
              `;
        return;
      }
      renderParticipations(enriched);
      return;
    }

    const { data: participations, error } = await supabase
      .from("participations")
      .select(
        `
                  id,
                  status,
                  created_at,
                  points_earned,
                  bags_collected,
                  campaigns (
                      id,
                      title,
                      neighborhood
                  )
              `
      )
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!participations || participations.length === 0) {
      document.getElementById("participationsContainer").innerHTML = `
                  <div class="empty-state">
                      <div class="empty-state-icon">🎪</div>
                      <p>${t("profile.notJoinedYet")}</p>
                      <a href="/dashboard" style="color: #28a745; text-decoration: none; font-weight: bold;">${t("profile.viewCampaigns") || "View Campaigns →"}</a>
                  </div>
              `;
      return;
    }

    renderParticipations(participations);
  } catch {
    document.getElementById("participationsContainer").innerHTML = `
              <div class="empty-state" style="color: #dc3545;">
                  <p>${t("profile.loadParticipationsError")}</p>
              </div>
          `;
  }
}

function renderParticipations(participations) {
  approvedCleanupCount = participations.filter((p) => p.status === "approved").length;
  let html = "";

  participations.forEach((participation) => {
    const campaign = participation.campaigns;
    const partLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    const partLocale = partLang === "bg" ? "bg-BG" : "en-US";
    const date = new Date(participation.created_at).toLocaleDateString(partLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    let statusBadge = "";
    switch (participation.status) {
      case "joined":
        statusBadge = `<span class="participation-status status-joined">${t("profile.statusJoined")}</span>`;
        break;
      case "pending":
        statusBadge = `<span class="participation-status status-pending">${t("profile.statusPending")}</span>`;
        break;
      case "approved":
        statusBadge = `<span class="participation-status status-approved">${t("profile.statusApproved")}</span>`;
        break;
      case "rejected":
        statusBadge = `<span class="participation-status status-rejected">${t("profile.statusRejected")}</span>`;
        break;
    }

    const pointsLine =
      participation.status === "approved" && participation.points_earned > 0
        ? `<p><strong>${t("profile.pointsEarned")}</strong> +${participation.points_earned} ⭐</p>`
        : "";

    const bagsLine =
      participation.bags_collected != null
        ? `<p><strong>${t("profile.bagsCollected")}</strong> ${participation.bags_collected} 🗑️</p>`
        : "";

    html += `
                <div class="participation-item">
                    <div class="participation-header">
                        <div class="participation-title">${escapeHTML(campaign?.title || t("profile.unknownCampaign"))}</div>
                        ${statusBadge}
                    </div>
                    <div class="participation-details">
                        <p><strong>${t("profile.neighborhoodLabel")}</strong> ${escapeHTML(campaign?.neighborhood || t("profile.unknown"))}</p>
                        <p><strong>${t("profile.dateLabel")}</strong> ${date}</p>
                        <p><strong>${t("profile.statusLabel")}</strong> ${participation.status.charAt(0).toUpperCase() + participation.status.slice(1)}</p>
                        ${pointsLine}
                        ${bagsLine}
                    </div>
                </div>
            `;
  });

  document.getElementById("participationsContainer").innerHTML = html;
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

/**
 * Toggle edit mode - show/hide edit form
 */
function toggleEditMode() {
  const editSection = document.getElementById("editProfileSection");

  if (editSection.style.display === "none") {
    // Show edit form
    editSection.style.display = "block";

    // Pre-fill form with current values
    document.getElementById("editUsername").value = userProfile?.username || "";
    document.getElementById("editNeighborhood").value =
      userProfile?.neighborhood || "Studentski Grad";

    // Show current avatar in preview
    const preview = document.getElementById("avatarPreview");
    const img = document.createElement("img");
    img.src = getAvatarUrl(userProfile);
    img.alt = "Avatar";
    img.onerror = () => {
      preview.textContent = "👤";
    };
    preview.textContent = "";
    preview.appendChild(img);
    avatarFile = null;
    const fileInput = document.getElementById("editAvatarFile");
    if (fileInput) fileInput.value = "";

    // Scroll to edit form
    editSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    // Hide edit form
    editSection.style.display = "none";
  }
}

/**
 * Handle save profile changes
 */
async function handleSaveProfile(e) {
  e.preventDefault();

  const newUsername = document.getElementById("editUsername").value.trim();
  const newNeighborhood = document.getElementById("editNeighborhood").value;
  const newPassword = document.getElementById("editPassword").value;

  if (!newUsername) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: t("profile.usernameRequired") || "Потребителското име е задължително!",
    });
    return;
  }

  // Validate new password if provided
  if (newPassword) {
    const pwError = rules.password(newPassword);
    if (pwError) {
      await Swal.fire({ icon: "error", title: t("auth.weakPasswordTitle"), text: pwError });
      return;
    }
  }

  try {
    // Show loading
    Swal.fire({
      title: t("profile.saving"),
      text: t("profile.pleaseWait"),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Check if demo mode
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (isDemoUser(localUser)) {
      // Demo mode - update localStorage (password change not supported in demo)
      localUser.username = newUsername;
      localUser.neighborhood = newNeighborhood;

      localStorage.setItem("user", JSON.stringify(localUser));
      userProfile = localUser;

      document.getElementById("userEmail").textContent = newUsername;
      document.getElementById("neighborhoodDisplay").textContent = newNeighborhood;
      document.getElementById("neighborhoodValue").textContent = newNeighborhood;

      Swal.close();
      await showSuccessToast(t("profile.savedSuccess"));

      toggleEditMode();
    } else {
      // Real mode - upload avatar if selected
      let newAvatarUrl = userProfile?.avatar_url || null;
      if (avatarFile) {
        const compressedAvatar = await compressImage(avatarFile, 512, 0.85);
        newAvatarUrl = await uploadAvatar(compressedAvatar, currentUser.id);
      }

      // Update Supabase profile
      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: newUsername,
          neighborhood: newNeighborhood,
          avatar_url: newAvatarUrl,
        })
        .eq("id", currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Change password if a new one was provided
      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw new Error(`Грешка при смяна на парола: ${pwError.message}`);
        document.getElementById("editPassword").value = "";
      }

      userProfile = data;
      avatarFile = null;

      // Update UI
      document.getElementById("userEmail").textContent = newUsername;
      document.getElementById("neighborhoodDisplay").textContent = newNeighborhood;
      document.getElementById("neighborhoodValue").textContent = newNeighborhood;
      displayAvatar(getAvatarUrl(userProfile));

      Swal.close();
      await showSuccessToast(t("profile.savedSuccess"));

      toggleEditMode();
    }
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("profile.saveError"),
    });
  }
}

/**
 * Display avatar image or emoji fallback
 */
function displayAvatar(avatarUrl) {
  const avatarEl = document.getElementById("avatarDisplay");
  if (!avatarEl) return;
  if (!avatarUrl) {
    avatarEl.textContent = "👤";
    return;
  }
  const img = document.createElement("img");
  img.src = avatarUrl;
  img.alt = "Profile avatar";
  img.onerror = () => {
    avatarEl.textContent = "👤";
  };
  avatarEl.textContent = "";
  avatarEl.appendChild(img);
}

// Add event listener to edit form
document.getElementById("editProfileForm")?.addEventListener("submit", handleSaveProfile);

// Avatar file input preview
const avatarFileInput = document.getElementById("editAvatarFile");
if (avatarFileInput) {
  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    avatarFile = file;
    const preview = document.getElementById("avatarPreview");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.alt = "Avatar preview";
      preview.textContent = "";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Initialise the push notifications UI section.
 * Reads current permission + subscription state and renders appropriate button/text.
 */
async function initPushUI() {
  const section = document.getElementById("pushNotificationsSection");
  if (!section) return;

  // Hide section for demo users — they have no real auth
  if (isDemoUser(currentUser)) {
    section.style.display = "none";
    return;
  }

  const { permission, subscribed } = await getPushStatus();

  const statusEl = document.getElementById("pushStatusText");
  const btn = document.getElementById("pushToggleBtn");
  const btnText = document.getElementById("pushToggleBtnText");
  const deniedHint = document.getElementById("pushDeniedHint");

  if (permission === "unsupported") {
    if (statusEl) statusEl.textContent = t("push.unsupported") || "Браузърът не поддържа известия.";
    return;
  }

  if (permission === "denied") {
    if (statusEl) statusEl.textContent = t("push.denied") || "Известията са блокирани.";
    if (deniedHint) deniedHint.style.display = "block";
    return;
  }

  if (subscribed) {
    if (statusEl) statusEl.textContent = t("push.enabled") || "Push известията са активни ✅";
    if (btn) {
      btn.style.display = "inline-block";
      btn.className = "btn btn-outline-danger btn-sm";
      if (btnText) btnText.setAttribute("data-i18n", "push.disableBtn");
      if (btnText) btnText.textContent = t("push.disableBtn") || "Деактивирай известия";
    }
  } else {
    if (statusEl) statusEl.textContent = t("push.disabled") || "Push известията са изключени.";
    if (btn) {
      btn.style.display = "inline-block";
      btn.className = "btn btn-outline-success btn-sm";
      if (btnText) btnText.setAttribute("data-i18n", "push.enableBtn");
      if (btnText) btnText.textContent = t("push.enableBtn") || "Активирай известия";
    }
  }
}

/**
 * Generate and download a shareable impact card for the current user.
 */
function handleShareImpact() {
  if (!userProfile) return;
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const points = userProfile.points_balance || 0;
  const rank =
    points >= 100
      ? lang === "en"
        ? "Gold"
        : "Злато"
      : points >= 50
        ? lang === "en"
          ? "Silver"
          : "Сребро"
        : lang === "en"
          ? "Bronze"
          : "Бронз";
  // Count approved participations from loaded data
  const cleanups = approvedCleanupCount;
  generateImpactCard({
    username:
      userProfile.username || currentUser?.email?.split("@")[0] || currentUser?.username || "User",
    points,
    cleanups,
    rank,
    lang,
  });
}

/**
 * GDPR Article 20 — export all personal data as a JSON file.
 */
async function handleExportData() {
  if (isDemoUser(currentUser)) return;
  try {
    const { data, error } = await supabase.rpc("export_user_data", { p_user_id: currentUser.id });
    if (error) throw error;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clean-quarter-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessToast(t("profile.exportDataSuccess"));
  } catch {
    Swal.fire({ icon: "error", title: t("common.error"), text: t("profile.exportDataError") });
  }
}
window.handleExportData = handleExportData;

/**
 * GDPR Article 17 — permanently delete all personal data and photos.
 */
async function handleDeleteAccount() {
  if (isDemoUser(currentUser)) return;

  const confirmed = await Swal.fire({
    title: t("profile.deleteAccountConfirmTitle"),
    text: t("profile.deleteAccountConfirmText"),
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: t("profile.deleteAccountBtn"),
    cancelButtonText: t("common.cancel"),
  });
  if (!confirmed.isConfirmed) return;

  try {
    Swal.fire({
      title: t("profile.pleaseWait"),
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // RPC anonymizes DB data and returns photo URLs for Storage cleanup
    const { data: photos, error } = await supabase.rpc("delete_user_data", {
      p_user_id: currentUser.id,
    });
    if (error) throw error;

    // Extract storage path from a full Supabase public URL
    const extractPath = (url, bucket) => {
      if (!url) return null;
      const marker = `/storage/v1/object/public/${bucket}/`;
      const idx = url.indexOf(marker);
      return idx !== -1 ? url.slice(idx + marker.length) : null;
    };

    const deletions = [];
    if (photos?.avatar_url) {
      const p = extractPath(photos.avatar_url, "avatars");
      if (p) deletions.push(supabase.storage.from("avatars").remove([p]));
    }
    const campaignPaths = (photos?.campaign_photos || [])
      .map((u) => extractPath(u, "campaign-photos"))
      .filter(Boolean);
    const participationPaths = (photos?.participation_photos || [])
      .map((u) => extractPath(u, "campaign-photos"))
      .filter(Boolean);
    const allPhotoPaths = [...campaignPaths, ...participationPaths];
    if (allPhotoPaths.length)
      deletions.push(supabase.storage.from("campaign-photos").remove(allPhotoPaths));

    await Promise.allSettled(deletions);

    await logout();
    removeUser();
    await Swal.fire({
      icon: "success",
      title: t("profile.deleteAccountSuccess"),
      timer: 2000,
      showConfirmButton: false,
    });
    window.location.href = "/";
  } catch {
    Swal.fire({ icon: "error", title: t("common.error"), text: t("profile.deleteAccountError") });
  }
}
window.handleDeleteAccount = handleDeleteAccount;

/**
 * Toggle push subscription on button click (called from onclick in HTML).
 */
async function handlePushToggle() {
  const { subscribed } = await getPushStatus();

  if (subscribed) {
    const result = await unsubscribeFromPush(currentUser.id);
    if (!result.success) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: t("push.error") || "Грешка при деактивиране.",
      });
      return;
    }
    showSuccessToast(t("push.disabledSuccess") || "Известията са деактивирани.");
  } else {
    const result = await subscribeToPush(currentUser.id);
    if (!result.success) {
      if (result.error === "denied") {
        document.getElementById("pushDeniedHint").style.display = "block";
      } else {
        Swal.fire({
          icon: "error",
          title: t("common.error"),
          text: t("push.error") || "Грешка при активиране.",
        });
      }
      return;
    }
    showSuccessToast(t("push.enabledSuccess") || "Известията са активирани! ✅");
  }

  initPushUI();
}
