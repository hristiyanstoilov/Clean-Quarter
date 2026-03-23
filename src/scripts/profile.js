import supabase from "../services/supabase.js";
import { uploadAvatar } from "../services/storage.js";
import { compressImage } from "../services/compressor.js";
import { getAvatarUrl } from "../services/avatars.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import {
  escapeHTML,
  showSuccessToast,
  initSwalFallback,
  applyPasswordChecklist,
} from "../utils/helpers.js";
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
// Global variables
let currentUser = null;
let userProfile = null;
let avatarFile = null;

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
      title: "Линкът е изтекъл",
      text: "Линкът за смяна на парола е изтекъл. Моля, заяви нов.",
      confirmButtonColor: "#28a745",
    });
    window.location.href = "/";
    return true;
  }

  const { value: newPassword } = await Swal.fire({
    title: "Нова парола",
    html:
      "<p>Въведи новата си парола:</p>" +
      '<input type="password" id="recoveryPassword" class="swal2-input" placeholder="Нова парола (мин. 8 символа)">',
    icon: "info",
    confirmButtonColor: "#28a745",
    confirmButtonText: "Запази паролата",
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
      title: "Грешка",
      text: error.message || "Неуспешна смяна на парола. Опитайте отново.",
    });
  } else {
    await Swal.fire({
      icon: "success",
      title: "Паролата е сменена",
      text: "Влез с новата си парола.",
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
  initNetworkStatusBanner();
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
    }

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
      userProfile.neighborhood || "Not set";
    document.getElementById("neighborhoodValue").textContent =
      userProfile.neighborhood || "Not set";
    document.getElementById("pointsDisplay").textContent =
      (userProfile.points_balance || 0) + " ⭐";
    document.getElementById("pointsValue").textContent = userProfile.points_balance || 0;

    // Display rank
    displayRank(userProfile.points_balance || 0);

    // Load transactions and participations in parallel
    await Promise.all([loadTransactions(), loadParticipations()]);

    // Show content
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("profileContent").style.display = "block";

    // Init push notifications UI (non-blocking)
    initPushUI();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || "Failed to load profile. Please try again.",
    });

    document.getElementById("loadingState").style.display = "none";
  }
}

/**
 * Display rank based on points
 */
function displayRank(points) {
  let rank, rankText, emoji;
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  if (points < 50) {
    rank = "bronze";
    rankText = lang === "en" ? "Bronze" : "Бронз";
    emoji = "🥉";
  } else if (points < 100) {
    rank = "silver";
    rankText = lang === "en" ? "Silver" : "Сребро";
    emoji = "🥈";
  } else {
    rank = "gold";
    rankText = lang === "en" ? "Gold" : "Злато";
    emoji = "🥇";
  }

  const rankBadge = document.getElementById("rankBadge");
  rankBadge.className = `rank-badge rank-${rank}`;
  rankBadge.innerHTML = `<span>${emoji}</span> ${rankText} (${points} ⭐)`;

  const pointsLabel = lang === "en" ? "points" : "точки";
  document.getElementById("rankValue").textContent = `${rankText} - ${points} ${pointsLabel}`;
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
                      <p>Все още няма транзакции</p>
                  </div>
              `;
      return;
    }

    let html = `
              <div class="table-container">
                  <table class="table">
                      <thead>
                          <tr>
                              <th>Дата</th>
                              <th>Тип</th>
                              <th>Количество</th>
                              <th>Причина</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

    transactions.forEach((transaction) => {
      const txLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
      const txLocale = txLang === "bg" ? "bg-BG" : "en-US";
      const date = new Date(transaction.created_at).toLocaleDateString(txLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const typeBadge =
        transaction.type === "earned"
          ? '<span class="badge-earned">✓ Спечелени</span>'
          : '<span class="badge-spent">✗ Изразходвани</span>';

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
                  <p>Грешка при зареждане на транзакциите</p>
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
                      <p>Все още не си се присъединил към кампания</p>
                      <a href="/dashboard" style="color: #28a745; text-decoration: none; font-weight: bold;">Виж кампаниите →</a>
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
                      <p>Все още не си се присъединил към кампания</p>
                      <a href="/dashboard" style="color: #28a745; text-decoration: none; font-weight: bold;">Виж кампаниите →</a>
                  </div>
              `;
      return;
    }

    renderParticipations(participations);
  } catch {
    document.getElementById("participationsContainer").innerHTML = `
              <div class="empty-state" style="color: #dc3545;">
                  <p>Грешка при зареждане на участията</p>
              </div>
          `;
  }
}

function renderParticipations(participations) {
  let html = "";

  participations.forEach((participation) => {
    const campaign = participation.campaigns;
    const date = new Date(participation.created_at).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    let statusBadge = "";
    switch (participation.status) {
      case "joined":
        statusBadge = '<span class="participation-status status-joined">📝 Присъединил се</span>';
        break;
      case "pending":
        statusBadge = '<span class="participation-status status-pending">⏳ Изчакване</span>';
        break;
      case "approved":
        statusBadge = '<span class="participation-status status-approved">✅ Одобрен</span>';
        break;
      case "rejected":
        statusBadge = '<span class="participation-status status-rejected">❌ Отхвърлен</span>';
        break;
    }

    html += `
                <div class="participation-item">
                    <div class="participation-header">
                        <div class="participation-title">${escapeHTML(campaign?.title || "Непозната кампания")}</div>
                        ${statusBadge}
                    </div>
                    <div class="participation-details">
                        <p><strong>Квартал:</strong> ${escapeHTML(campaign?.neighborhood || "Неизвестен")}</p>
                        <p><strong>Дата:</strong> ${date}</p>
                        <p><strong>Статус:</strong> ${participation.status.charAt(0).toUpperCase() + participation.status.slice(1)}</p>
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
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.removeItem("user");
      window.location.href = "/";
    } else {
      throw error;
    }
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
      title: "Грешка",
      text: "Потребителското име е задължително!",
    });
    return;
  }

  // Validate new password if provided
  if (newPassword) {
    const pwError = rules.password(newPassword);
    if (pwError) {
      await Swal.fire({ icon: "error", title: "Слаба парола", text: pwError });
      return;
    }
  }

  try {
    // Show loading
    Swal.fire({
      title: "Запазване...",
      text: "Моля изчакайте",
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
      await showSuccessToast("Профилът е обновен успешно!");

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
      await showSuccessToast("Профилът е обновен успешно!");

      toggleEditMode();
    }
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Грешка",
      text: error.message || "Грешка при запазване на промените",
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
document.getElementById("editProfileForm").addEventListener("submit", handleSaveProfile);

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

// Expose functions to window for onclick handlers
window.handleLogout = handleLogout;
window.toggleEditMode = toggleEditMode;
window.handlePushToggle = handlePushToggle;
