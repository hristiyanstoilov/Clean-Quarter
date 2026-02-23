import supabase from "../services/supabase.js";
import { uploadAvatar } from "../services/storage.js";
import { initI18n, applyLanguage, setLanguage } from "../utils/i18n.js";
import { escapeHTML, showSuccessToast } from "../utils/helpers.js";
import { rules } from "../services/validation.js";
// Global variables
let currentUser = null;
let userProfile = null;
let avatarFile = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
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
    document.getElementById("languageSelector").value =
      localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    document.getElementById("languageSelector").addEventListener("change", (e) => {
      setLanguage(e.target.value, true); // Force update with true flag
      location.reload();
    });

    await checkAuth();
    await loadProfileData();

    // Live password validation
    const pwLength = document.getElementById("edit-pw-length");
    const pwUppercase = document.getElementById("edit-pw-uppercase");
    const pwLowercase = document.getElementById("edit-pw-lowercase");
    const pwDigit = document.getElementById("edit-pw-digit");
    if (passwordInput) {
      passwordInput.addEventListener("input", (e) => {
        const value = e.target.value;
        // Length
        if (value.length >= 8) {
          pwLength.classList.remove("text-danger");
          pwLength.classList.add("text-success");
        } else {
          pwLength.classList.remove("text-success");
          pwLength.classList.add("text-danger");
        }
        // Uppercase
        if (/[A-Z]/.test(value)) {
          pwUppercase.classList.remove("text-danger");
          pwUppercase.classList.add("text-success");
        } else {
          pwUppercase.classList.remove("text-success");
          pwUppercase.classList.add("text-danger");
        }
        // Lowercase
        if (/[a-z]/.test(value)) {
          pwLowercase.classList.remove("text-danger");
          pwLowercase.classList.add("text-success");
        } else {
          pwLowercase.classList.remove("text-success");
          pwLowercase.classList.add("text-danger");
        }
        // Digit
        if (/[0-9]/.test(value)) {
          pwDigit.classList.remove("text-danger");
          pwDigit.classList.add("text-success");
        } else {
          pwDigit.classList.remove("text-success");
          pwDigit.classList.add("text-danger");
        }
      });
    }
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
 * Load profile data and transactions
 */
async function loadProfileData() {
  try {
    let profile;

    // Check if in demo mode
    if (currentUser.id === "demo-admin-001") {
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
    displayAvatar(userProfile.avatar_url);

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
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Error",
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

  if (points < 50) {
    rank = "bronze";
    rankText = "Bronze";
    emoji = "🥉";
  } else if (points < 100) {
    rank = "silver";
    rankText = "Silver";
    emoji = "🥈";
  } else {
    rank = "gold";
    rankText = "Gold";
    emoji = "🥇";
  }

  const rankBadge = document.getElementById("rankBadge");
  rankBadge.className = `rank-badge rank-${rank}`;
  rankBadge.innerHTML = `<span>${emoji}</span> ${rankText} (${points} ⭐)`;

  document.getElementById("rankValue").textContent = `${rankText} - ${points} points`;
}

/**
 * Load and display transactions
 */
async function loadTransactions() {
  try {
    let transactions = [];

    // Check if in demo mode
    if (currentUser.id === "demo-admin-001") {
      transactions = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_TRANSACTIONS") || "[]");
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
                      <p>No transactions yet</p>
                  </div>
              `;
      return;
    }

    let html = `
              <div class="table-container">
                  <table class="table">
                      <thead>
                          <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Amount</th>
                              <th>Reason</th>
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
          ? '<span class="badge-earned">✓ Earned</span>'
          : '<span class="badge-spent">✗ Spent</span>';

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
  } catch (error) {
    document.getElementById("transactionsContainer").innerHTML = `
              <div class="empty-state" style="color: #dc3545;">
                  <p>Failed to load transactions</p>
              </div>
          `;
  }
}

/**
 * Load and display user participations
 */
async function loadParticipations() {
  try {
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
                      <p>You haven't joined any campaigns yet</p>
                      <a href="/dashboard" style="color: #28a745; text-decoration: none; font-weight: bold;">Browse campaigns →</a>
                  </div>
              `;
      return;
    }

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
          statusBadge = '<span class="participation-status status-joined">📝 Joined</span>';
          break;
        case "pending":
          statusBadge = '<span class="participation-status status-pending">⏳ Pending</span>';
          break;
        case "approved":
          statusBadge = '<span class="participation-status status-approved">✅ Approved</span>';
          break;
        case "rejected":
          statusBadge = '<span class="participation-status status-rejected">❌ Rejected</span>';
          break;
      }

      html += `
                  <div class="participation-item">
                      <div class="participation-header">
                          <div class="participation-title">${escapeHTML(campaign?.title || "Unknown Campaign")}</div>
                          ${statusBadge}
                      </div>
                      <div class="participation-details">
                          <p><strong>Neighborhood:</strong> ${escapeHTML(campaign?.neighborhood || "Unknown")}</p>
                          <p><strong>Joined:</strong> ${date}</p>
                          <p><strong>Status:</strong> ${participation.status.charAt(0).toUpperCase() + participation.status.slice(1)}</p>
                      </div>
                  </div>
              `;
    });

    document.getElementById("participationsContainer").innerHTML = html;
  } catch (error) {
    document.getElementById("participationsContainer").innerHTML = `
              <div class="empty-state" style="color: #dc3545;">
                  <p>Failed to load participations</p>
              </div>
          `;
  }
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
  } catch (error) {
    // silently ignore
  }
}

/**
 * Toggle edit mode - show/hide edit form
 */
function toggleEditMode() {
  const editSection = document.getElementById("editProfileSection");
  const accountSection = document.querySelector(".section");

  if (editSection.style.display === "none") {
    // Show edit form
    editSection.style.display = "block";

    // Pre-fill form with current values
    document.getElementById("editUsername").value = userProfile?.username || "";
    document.getElementById("editNeighborhood").value =
      userProfile?.neighborhood || "Studentski Grad";

    // Show current avatar in preview
    const preview = document.getElementById("avatarPreview");
    if (userProfile?.avatar_url) {
      const img = document.createElement("img");
      img.src = userProfile.avatar_url;
      img.alt = "Avatar";
      preview.textContent = "";
      preview.appendChild(img);
    } else {
      preview.textContent = "👤";
    }
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

  if (!newUsername) {
    await Swal.fire({
      icon: "error",
      title: "Грешка",
      text: "Потребителското име е задължително!",
    });
    return;
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

    if (localUser.id === "demo-admin-001") {
      // Demo mode - update localStorage
      localUser.username = newUsername;
      localUser.neighborhood = newNeighborhood;

      localStorage.setItem("user", JSON.stringify(localUser));
      userProfile = localUser;

      document.getElementById("userEmail").textContent = newUsername;
      document.getElementById("neighborhoodDisplay").textContent = newNeighborhood;
      document.getElementById("neighborhoodValue").textContent = newNeighborhood;

      await showSuccessToast("Профилът е обновен успешно!");

      toggleEditMode();
    } else {
      // Real mode - upload avatar if selected
      let newAvatarUrl = userProfile?.avatar_url || null;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile, currentUser.id);
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

      userProfile = data;
      avatarFile = null;

      // Update UI
      document.getElementById("userEmail").textContent = newUsername;
      document.getElementById("neighborhoodDisplay").textContent = newNeighborhood;
      document.getElementById("neighborhoodValue").textContent = newNeighborhood;
      displayAvatar(newAvatarUrl);

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
  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "Profile avatar";
    avatarEl.textContent = "";
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = "👤";
  }
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

// Expose functions to window for onclick handlers
window.handleLogout = handleLogout;
window.toggleEditMode = toggleEditMode;
