import supabase from "../services/supabase.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import { escapeHTML, showSuccessToast, showInfoToast, initSwalFallback } from "../utils/helpers.js";
import {
  isDemoUser,
  getDemoParticipations,
  getDemoCampaigns,
  getDemoUsers,
  saveDemoUsers,
  updateDemoUser,
  updateDemoParticipation,
  getDemoTransactions,
  addDemoTransaction,
  getDemoRoleLog,
  saveDemoRoleLog,
} from "../utils/demoMode.js";

// Global variables
let currentUser = null;
let pendingParticipations = [];
let pendingCurrentPage = 1;
const PENDING_PAGE_SIZE = 10;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  // Ensure Swal is available even if CDN fails to load
  initSwalFallback();
  try {
    // Close any lingering SweetAlert modals from previous sessions
    if (window.Swal && Swal.close) {
      Swal.close();
    }

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

    await checkAuth();

    // Notification bell (skip demo users)
    if (currentUser?.id && !isDemoUser(currentUser)) {
      import("../services/notifications.js").then(({ initNotificationBell }) => {
        initNotificationBell(currentUser.id);
      });
    }

    await loadAdminData();
  } catch (error) {
    // silently ignore
  }
});

/**
 * Check if user is authenticated and has admin role
 */
async function checkAuth() {
  // Check for demo mode user first
  const localUser = localStorage.getItem("user");
  if (localUser) {
    try {
      currentUser = JSON.parse(localUser);
      // Check if demo user is admin
      if (currentUser.role === "admin") {
        return; // Demo admin, allow access
      } else {
        // Demo user but not admin
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("accessDenied").style.display = "block";
        return;
      }
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

  // Fetch user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    // User is not an admin, show access denied
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("accessDenied").style.display = "block";
    return;
  }
}

/**
 * Load admin data
 */
async function loadAdminData() {
  try {
    // Force close any existing SweetAlert modals
    if (window.Swal && Swal.close) {
      Swal.close();
    }

    // Check if we're in demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);

    let allParticipationsData = [];

    if (isDemoMode) {
      // DEMO MODE: Load from localStorage
      const participations = getDemoParticipations();
      const campaigns = getDemoCampaigns();
      const users = getDemoUsers();

      // Join participations with campaigns and users
      allParticipationsData = participations.map((p) => {
        const campaign = campaigns.find((c) => c.id === p.campaign_id);
        const user = users.find((u) => u.id === p.user_id) || currentUser;
        return {
          id: p.id,
          status: p.status,
          after_photo_url: p.after_photo_url,
          created_at: p.created_at,
          user_id: p.user_id,
          campaign_id: p.campaign_id,
          campaigns: campaign
            ? {
                id: campaign.id,
                title: campaign.title,
                before_photo_url: campaign.before_photo_url,
              }
            : null,
          profiles: {
            username: user?.username || "Demo User",
          },
        };
      });
    } else {
      // REAL MODE: Fetch from Supabase
      const { data: allParticipations, error: allError } = await supabase
        .from("participations")
        .select(
          `
                      id,
                      status,
                      after_photo_url,
                      created_at,
                      user_id,
                      campaign_id,
                      campaigns (
                          id,
                          title,
                          before_photo_url
                      ),
                      profiles (
                          username
                      )
                  `
        )
        .order("created_at", { ascending: false });

      if (allError) {
        throw new Error(`Failed to fetch participations: ${allError.message}`);
      }

      allParticipationsData = allParticipations || [];
    }

    // Filter pending participations
    pendingParticipations = allParticipationsData.filter((p) => p.status === "pending");
    pendingCurrentPage = 1;

    // Calculate statistics
    const totalApproved = allParticipationsData.filter((p) => p.status === "approved").length;
    const totalRejected = allParticipationsData.filter((p) => p.status === "rejected").length;

    // Update stats
    document.getElementById("totalPendingCount").textContent = pendingParticipations.length;
    document.getElementById("totalApprovedCount").textContent = totalApproved;
    document.getElementById("totalRejectedCount").textContent = totalRejected;

    // Load and render users
    await loadAndRenderUsers();

    // Preload role log for quick access
    window._roleLogCache = null;
    await preloadRoleLog();

    // Render pending table
    renderPendingTable();

    // Load reports
    await loadReports();

    // Show admin content
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("adminContent").style.display = "block";

    // Double-check: ensure no SweetAlert modals are open
    if (window.Swal && Swal.close) {
      Swal.close();
    }
  } catch (error) {
    document.getElementById("loadingState").style.display = "none";
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Грешка",
      text: error.message || t("admin.failedToLoad") || "Грешка при зареждане.",
    });
  }
}

/**
 * Preload role change log for quick access
 */
async function preloadRoleLog() {
  try {
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);
    if (isDemoMode) {
      window._roleLogCache = getDemoRoleLog();
    } else {
      // Real mode: fetch from Supabase
      const { data, error } = await supabase
        .from("point_transactions")
        .select("id, user_id, reason, created_at")
        .eq("type", "role_change")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      window._roleLogCache = data || [];
    }
  } catch (err) {
    window._roleLogCache = [];
  }
}

/**
 * Show role change log in UI
 */
let _allRoleLogCache = [];
window.showRoleLog = async function () {
  const container = document.getElementById("roleLogContainer");
  const searchWrapper = document.getElementById("roleLogSearchWrapper");
  if (container.style.display === "block") {
    container.style.display = "none";
    if (searchWrapper) searchWrapper.style.display = "none";
    return;
  }
  container.style.display = "block";
  if (searchWrapper) searchWrapper.style.display = "block";
  let logs = window._roleLogCache;
  if (!logs) {
    await preloadRoleLog();
    logs = window._roleLogCache;
  }
  _allRoleLogCache = logs || [];
  filterRoleLogTable();
};

window.filterRoleLogTable = function () {
  const container = document.getElementById("roleLogContainer");
  const search = (document.getElementById("roleLogSearchInput")?.value || "").toLowerCase();
  let logs = _allRoleLogCache || [];
  let filtered = !search
    ? logs
    : logs.filter(
        (log) =>
          (log.user_id || "").toLowerCase().includes(search) ||
          (log.reason || "").toLowerCase().includes(search) ||
          (log.created_at || "").toLowerCase().includes(search)
      );
  if (!filtered.length) {
    container.innerHTML =
      "<div class='empty-state'><p data-i18n='admin.noRoleChanges'>No role changes found.</p></div>";
    applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
    return;
  }
  // Add ARIA roles and column scopes to role log table
  let html =
    "<div class='table-responsive'><table class='table table-sm table-bordered' role='table' aria-label='Role change log'><thead><tr><th scope='col' data-i18n='admin.roleLogDate'>Date</th><th scope='col' data-i18n='admin.roleLogUser'>User ID</th><th scope='col' data-i18n='admin.roleLogChange'>Change</th></tr></thead><tbody>";
  filtered.forEach((log) => {
    html += `<tr><td>${log.created_at ? new Date(log.created_at).toLocaleString() : "-"}<\/td><td>${escapeHTML(log.user_id || "-")}<\/td><td>${escapeHTML(log.reason || "-")}<\/td><\/tr>`;
  });
  html += "<\/tbody><\/table><\/div>";
  container.innerHTML = html;
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
};

/**
 * Load and render all users for User Management section
 */
async function loadAndRenderUsers() {
  try {
    let users = [];
    // Demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);
    if (isDemoMode) {
      users = getDemoUsers();
      // Mark superadmins (demo: first admin is superadmin)
      if (users.length) {
        const superadmins = users.filter((u) => u.role === "admin" && u.is_superadmin);
        if (!superadmins.length) users[0].is_superadmin = true;
      }
    } else {
      // Real mode: fetch from Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, role, points_balance, neighborhood, is_superadmin");
      if (error) throw new Error("Failed to fetch users: " + error.message);
      users = data || [];
    }

    renderUserTable(users);
  } catch (err) {
    document.getElementById("userTableContainer").innerHTML =
      `<div class='empty-state'><p>Error loading users: ${escapeHTML(err.message)}</p></div>`;
  }
}

/**
 * Render user table with role management capabilities
 */
let _allUsersCache = [];

function renderUserTable(users) {
  _allUsersCache = users || [];
  window.filterUserTable();
}

/**
 * Filter user table based on search input
 */
window.filterUserTable = function () {
  const container = document.getElementById("userTableContainer");
  const searchInput = document.getElementById("userSearchInput");
  const search = (searchInput?.value || "").toLowerCase();

  let filtered = !search
    ? _allUsersCache
    : _allUsersCache.filter(
        (user) =>
          (user.username || "").toLowerCase().includes(search) ||
          (user.email || "").toLowerCase().includes(search) ||
          (user.role || "").toLowerCase().includes(search) ||
          (user.neighborhood || "").toLowerCase().includes(search)
      );

  if (!filtered.length) {
    container.innerHTML = `
      <div class='empty-state'>
        <p data-i18n='admin.noUsersFound'>No users found.</p>
      </div>
    `;
    applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
    return;
  }

  // Sort: admins first, then by username
  filtered.sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return (a.username || "").localeCompare(b.username || "");
  });

  let html = `
    <div class='table-responsive'>
      <table class='table table-hover table-sm' role='table' aria-label='User management table'>
        <thead>
          <tr>
            <th scope='col' data-i18n='admin.username'>Username</th>
            <th scope='col' data-i18n='admin.email'>Email</th>
            <th scope='col' data-i18n='admin.role'>Role</th>
            <th scope='col' data-i18n='admin.points'>Points</th>
            <th scope='col' data-i18n='admin.neighborhood'>Neighborhood</th>
            <th scope='col' data-i18n='admin.actions'>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  const currentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  filtered.forEach((user) => {
    const isAdmin = user.role === "admin";
    const isSelf = user.id === currentUser.id || user.email === currentUser.email;

    const roleBadge = isAdmin
      ? "<span class='badge bg-success' data-i18n='admin.adminRole'>Admin</span>"
      : "<span class='badge bg-secondary' data-i18n='admin.userRole'>User</span>";

    // Parse neighborhood if it's JSON
    let neighborhood = user.neighborhood || "-";
    if (typeof neighborhood === "string" && neighborhood.startsWith("{")) {
      try {
        const nbhObj = JSON.parse(neighborhood);
        neighborhood = nbhObj[currentLang] || nbhObj.bg || nbhObj.en || "-";
      } catch (e) {
        // Keep as-is if parsing fails
      }
    }

    const points = user.points_balance || 0;

    html += `
      <tr>
        <td><strong>${escapeHTML(user.username || "N/A")}</strong></td>
        <td><small>${escapeHTML(user.email || "N/A")}</small></td>
        <td>${roleBadge}</td>
        <td><strong>${points}</strong></td>
        <td><small>${escapeHTML(neighborhood)}</small></td>
        <td>
    `;

    if (isAdmin && !isSelf) {
      // Show Remove Admin button
      const escapedId = user.id.replace(/'/g, "\\'");
      const escapedName = (user.username || user.email).replace(/'/g, "\\'");
      html += `
        <button
          class='btn btn-warning btn-sm'
          onclick="window.removeAdmin('${escapedId}', '${escapedName}')"
          aria-label='Remove admin privileges from ${escapeHTML(user.username || user.email)}'
        >
          ⬇️ <span data-i18n='admin.removeAdmin'>Премахни админ</span>
        </button>
      `;
    } else if (!isAdmin) {
      // Show Make Admin button
      const escapedId = user.id.replace(/'/g, "\\'");
      const escapedName = (user.username || user.email).replace(/'/g, "\\'");
      html += `
        <button
          class='btn btn-success btn-sm'
          onclick="window.makeAdmin('${escapedId}', '${escapedName}')"
          aria-label='Grant admin privileges to ${escapeHTML(user.username || user.email)}'
        >
          ⬆️ <span data-i18n='admin.makeAdmin'>Направи админ</span>
        </button>
      `;
    } else if (isSelf) {
      // Can't modify yourself
      html += `
        <span class='text-muted small' data-i18n='admin.selfNoModify'>(Вие)</span>
      `;
    }

    html += `
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
};

/**
 * Grant admin privileges to a user
 */
window.makeAdmin = async function (userId, username) {
  try {
    const result = await Swal.fire({
      title: t("admin.makeAdminTitle") || "Make Admin?",
      text: t("admin.makeAdminConfirm", { username }) || `Grant admin privileges to ${username}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("admin.yesMakeAdmin") || "Yes, Make Admin",
      cancelButtonText: t("common.cancel") || "Cancel",
    });

    if (!result.isConfirmed) return;

    // Show loading — no await: Swal.fire(loading) must not block the code that follows
    Swal.fire({
      title: t("common.loading") || "Processing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);

    if (isDemoMode) {
      // Demo mode
      const users = getDemoUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex].role = "admin";
      saveDemoUsers(users);

      // Log role change
      const roleLog = getDemoRoleLog();
      roleLog.push({
        id: "role_" + Date.now(),
        user_id: userId,
        reason: `Made admin by ${currentUser.username || currentUser.email}`,
        created_at: new Date().toISOString(),
      });
      saveDemoRoleLog(roleLog);
    } else {
      // Real mode: atomic role change via SECURITY DEFINER RPC
      const { data: result, error: rpcError } = await supabase.rpc("set_user_role", {
        p_user_id: userId,
        p_role: "admin",
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!result?.success) throw new Error(result?.error || "Failed to grant admin role");
    }

    Swal.close();

    await showSuccessToast(t("admin.adminGrantedTitle") || `${username} is now an admin.`);

    // Reload users
    await loadAndRenderUsers();
  } catch (error) {
    Swal.close();
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Error",
      text: error.message || "Failed to grant admin privileges.",
    });
  }
};

/**
 * Remove admin privileges from a user
 */
window.removeAdmin = async function (userId, username) {
  try {
    // Security check: prevent self-removal
    if (userId === currentUser.id || (currentUser.email && userId === currentUser.email)) {
      await Swal.fire({
        icon: "error",
        title: t("admin.cannotRemoveSelfTitle") || "Cannot Remove Self",
        text: t("admin.cannotRemoveSelfMsg") || "You cannot remove your own admin privileges.",
      });
      return;
    }

    const result = await Swal.fire({
      title: t("admin.removeAdminTitle") || "Remove Admin?",
      text:
        t("admin.removeAdminConfirm", { username }) || `Remove admin privileges from ${username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("admin.yesRemoveAdmin") || "Yes, Remove Admin",
      cancelButtonText: t("common.cancel") || "Cancel",
    });

    if (!result.isConfirmed) return;

    // Show loading — no await: Swal.fire(loading) must not block the code that follows
    Swal.fire({
      title: t("common.loading") || "Processing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);

    if (isDemoMode) {
      // Demo mode
      const users = getDemoUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex].role = "user";
      saveDemoUsers(users);

      // Log role change
      const roleLog = getDemoRoleLog();
      roleLog.push({
        id: "role_" + Date.now(),
        user_id: userId,
        reason: `Removed from admin by ${currentUser.username || currentUser.email}`,
        created_at: new Date().toISOString(),
      });
      saveDemoRoleLog(roleLog);
    } else {
      // Real mode: atomic role change via SECURITY DEFINER RPC
      const { data: result, error: rpcError } = await supabase.rpc("set_user_role", {
        p_user_id: userId,
        p_role: "user",
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!result?.success) throw new Error(result?.error || "Failed to remove admin role");
    }

    Swal.close();

    await showSuccessToast(t("admin.adminRemovedTitle") || `${username} is no longer an admin.`);

    // Reload users
    await loadAndRenderUsers();
  } catch (error) {
    Swal.close();
    await Swal.fire({
      icon: "error",
      title: t("common.error") || "Error",
      text: error.message || "Failed to remove admin privileges.",
    });
  }
};

/**
 * Render pending participations table
 */
function renderPendingTable() {
  const container = document.getElementById("pendingTableContainer");

  if (pendingParticipations.length === 0) {
    container.innerHTML = `
              <div class="empty-state">
                  <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                  <h3 data-i18n="admin.noPendingReviews">No Pending Reviews</h3>
                  <p data-i18n="admin.allReviewed">All submissions have been reviewed. Great job!</p>
              </div>
          `;
    return;
  }

  const totalPages = Math.ceil(pendingParticipations.length / PENDING_PAGE_SIZE);
  if (pendingCurrentPage > totalPages) pendingCurrentPage = totalPages;
  const start = (pendingCurrentPage - 1) * PENDING_PAGE_SIZE;
  const pageItems = pendingParticipations.slice(start, start + PENDING_PAGE_SIZE);

  let tableHTML = `
  <div class="table-responsive">
      <table class="table table-hover" role="table" aria-label="Pending participations">
          <thead>
              <tr>
                  <th scope="col" data-i18n="admin.username">User</th>
                  <th scope="col" data-i18n="admin.campaign">Campaign</th>
                  <th scope="col" data-i18n="admin.beforePhoto">Before Photo</th>
                  <th scope="col" data-i18n="admin.afterPhoto">After Photo</th>
                  <th scope="col" data-i18n="admin.submitted">Submitted</th>
                  <th scope="col" data-i18n="admin.actions">Actions</th>
              </tr>
          </thead>
          <tbody>
`;
  const currentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  pageItems.forEach((participation) => {
    const username = participation.profiles?.username || "Unknown User";

    // Parse campaign title if it's a JSON object
    let campaignTitle = participation.campaigns?.title || "Unknown Campaign";
    if (typeof campaignTitle === "string" && campaignTitle.startsWith("{")) {
      try {
        const titleObj = JSON.parse(campaignTitle);
        campaignTitle = titleObj[currentLang] || titleObj.bg || titleObj.en || "Unknown Campaign";
      } catch (e) {
        // Keep as-is if parsing fails
      }
    } else if (typeof campaignTitle === "object") {
      campaignTitle =
        campaignTitle[currentLang] || campaignTitle.bg || campaignTitle.en || "Unknown Campaign";
    }

    const beforePhoto = participation.campaigns?.before_photo_url || "";
    const afterPhoto = participation.after_photo_url || "";
    const submittedDate = new Date(participation.created_at).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    tableHTML += `
              <tr>
                  <td><strong>${escapeHTML(username)}</strong></td>
                  <td>${escapeHTML(campaignTitle)}</td>
                  <td>
                      ${beforePhoto ? `<img src="${beforePhoto}" class="photo-thumbnail" alt="${t("campaign.beforePhoto")}" onclick="showPhotoModal('${beforePhoto}')">` : `<span data-i18n="admin.noPhoto">${t("admin.noPhoto")}</span>`}
                  </td>
                  <td>
                      ${afterPhoto ? `<img src="${afterPhoto}" class="photo-thumbnail" alt="${t("campaign.afterPhoto")}" onclick="showPhotoModal('${afterPhoto}')">` : `<span data-i18n="admin.noPhoto">${t("admin.noPhoto")}</span>`}
                  </td>
                  <td>${submittedDate}</td>
                  <td>
                      <div class="action-buttons">
                          <button class="btn-approve" onclick="handleApprove('${participation.id}', '${username}')">
                            ✅ <span data-i18n="admin.approve">Approve</span>
                          </button>
                          <button class="btn-reject" onclick="handleReject('${participation.id}', '${username}')">
                            ❌ <span data-i18n="admin.reject">Reject</span>
                          </button>
                      </div>
                  </td>
              </tr>
          `;
  });

  tableHTML += `
                  </tbody>
              </table>
          </div>
      `;

  if (totalPages > 1) {
    const showing = t("admin.showingOf")
      .replace("{from}", start + 1)
      .replace("{to}", Math.min(start + PENDING_PAGE_SIZE, pendingParticipations.length))
      .replace("{total}", pendingParticipations.length);
    tableHTML += `
      <div class="d-flex justify-content-between align-items-center mt-3 px-1">
        <span class="text-muted small">${showing}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" id="pendingPrevBtn"
            onclick="pendingCurrentPage--; renderPendingTable()"
            ${pendingCurrentPage <= 1 ? "disabled" : ""}>
            ← <span data-i18n="admin.prev">Предишна</span>
          </button>
          <span class="btn btn-sm btn-light disabled">${pendingCurrentPage} / ${totalPages}</span>
          <button class="btn btn-sm btn-outline-secondary" id="pendingNextBtn"
            onclick="pendingCurrentPage++; renderPendingTable()"
            ${pendingCurrentPage >= totalPages ? "disabled" : ""}>
            <span data-i18n="admin.next">Следваща</span> →
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = tableHTML;
  applyLanguage(localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg");
}

/**
 * Show photo in modal
 */
function showPhotoModal(photoUrl) {
  document.getElementById("modalPhoto").src = photoUrl;
  document.getElementById("photoModal").style.display = "block";
}

/**
 * Close photo modal
 */
function closePhotoModal() {
  document.getElementById("photoModal").style.display = "none";
}

/**
 * Handle approve action
 */
async function handleApprove(participationId, username) {
  try {
    // Find the participation record
    const participation = pendingParticipations.find((p) => p.id === participationId);
    if (!participation) {
      throw new Error("Participation not found");
    }

    // Show confirmation
    const result = await Swal.fire({
      title: t("admin.approveSubmissionTitle"),
      text: t("admin.awardPoints", { points: 20, username }),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("admin.yesApprove"),
      cancelButtonText: t("common.cancel"),
    });

    if (!result.isConfirmed) {
      return;
    }

    // Show loading — no await: Swal.fire(loading) must not block the code that follows
    Swal.fire({
      title: t("common.loading"),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Check if we're in demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);
    const POINTS_AWARDED = 20;

    if (isDemoMode) {
      try {
        // DEMO MODE: Update localStorage
        updateDemoParticipation(participationId, { status: "approved" });

        // Find the user who submitted the participation
        const participantId = participation.user_id;
        const demoUsers = getDemoUsers();
        let participant = demoUsers.find((u) => u.id === participantId);
        if (!participant) {
          // fallback: if no users array, try currentUser (for legacy demo)
          participant = currentUser;
        }
        if (!participant) {
          throw new Error("Demo Mode: Participant not found");
        }

        // Update points balance
        const newBalance = (participant.points_balance || 0) + POINTS_AWARDED;
        if (demoUsers.length > 0) {
          updateDemoUser(participantId, { points_balance: newBalance });
        } else {
          localStorage.setItem(
            "user",
            JSON.stringify({ ...participant, points_balance: newBalance })
          );
        }

        // Add transaction record
        addDemoTransaction({
          id: "demo_trans_" + Date.now(),
          user_id: participantId,
          amount: POINTS_AWARDED,
          type: "earned",
          reason: `Cleanup proof approved - ${participation.campaigns?.title || "Campaign"}`,
          participation_id: participationId,
          created_at: new Date().toISOString(),
        });

        Swal.close();

        await showSuccessToast(t("admin.approvedTitle"));
      } catch (demoError) {
        Swal.close();
        await Swal.fire({
          icon: "error",
          title: t("admin.demoModeError"),
          text: demoError.message || t("admin.failedToApproveDemo"),
        });
        return;
      }
    } else {
      // REAL MODE: atomic approve via SECURITY DEFINER RPC
      const { data: result, error: rpcError } = await supabase.rpc("approve_participation", {
        p_participation_id: participationId,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }
      if (!result?.success) {
        throw new Error(result?.error || "Failed to approve participation");
      }

      Swal.close();

      await showSuccessToast(t("admin.approvedTitle"));
    }

    // Reload admin data
    await loadAdminData();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("admin.failedToApprove"),
    });
  }
}

/**
 * Handle reject action
 */
async function handleReject(participationId, username) {
  try {
    // Find the participation record
    const participation = pendingParticipations.find((p) => p.id === participationId);
    if (!participation) {
      throw new Error("Participation not found");
    }

    // Prompt for rejection reason (required)
    const result = await Swal.fire({
      title: t("admin.rejectSubmissionTitle"),
      input: "textarea",
      inputLabel: t("admin.rejectionReasonLabel"),
      inputPlaceholder: t("admin.rejectionReasonPlaceholder"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: t("admin.yesReject"),
      cancelButtonText: t("common.cancel"),
      inputAttributes: {
        "aria-label": t("admin.rejectionReasonAria"),
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return t("admin.rejectionReasonRequired") || "Моля, въведи причина за отхвърляне";
        }
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const rejectionReason = result.value.trim();

    // Show loading — no await: Swal.fire(loading) must not block the code that follows
    Swal.fire({
      title: t("common.loading") || "Зареждане...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Check if we're in demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);

    if (isDemoMode) {
      // DEMO MODE: Update localStorage
      updateDemoParticipation(participationId, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });

      Swal.close();

      await showInfoToast(t("admin.rejectedTitle"));
    } else {
      // REAL MODE: Use Supabase
      const { error: updateError } = await supabase
        .from("participations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", participationId);

      if (updateError) {
        throw new Error(`Failed to reject participation: ${updateError.message}`);
      }

      Swal.close();

      await showInfoToast(t("admin.rejectedTitle"));
    }

    // Reload admin data
    await loadAdminData();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || t("admin.failedToReject"),
    });
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
 * Load pending reports and render them in the admin reports table.
 */
async function loadReports() {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const container = document.getElementById("reportsTableContainer");
  if (!container) return;

  if (isDemoUser(currentUser)) {
    container.innerHTML = `<p class="text-muted" data-i18n="admin.noReports">${lang === "en" ? "No pending reports" : "Няма нови доклади"}</p>`;
    return;
  }

  try {
    const { data: reports, error } = await supabase
      .from("reports")
      .select(
        "id, reason, description, created_at, status, entity_id, entity_type, reporter:profiles!reported_by(username)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!reports || reports.length === 0) {
      container.innerHTML = `<p class="text-muted" data-i18n="admin.noReports">${lang === "en" ? "No pending reports" : "Няма нови доклади"}</p>`;
      return;
    }

    const locale = lang === "bg" ? "bg-BG" : "en-US";
    const rows = reports
      .map((r) => {
        const date = new Date(r.created_at).toLocaleString(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const reporter = r.reporter?.username || "—";
        const reasonMap = {
          spam: lang === "en" ? "Spam" : "Спам",
          inappropriate: lang === "en" ? "Inappropriate" : "Неподходящо",
          harassment: lang === "en" ? "Harassment" : "Тормоз",
          fake: lang === "en" ? "Fake" : "Фалшиво",
          other: lang === "en" ? "Other" : "Друго",
        };
        const reason = reasonMap[r.reason] || r.reason;

        return `
          <tr>
            <td>${date}</td>
            <td>${reporter}</td>
            <td><strong>${reason}</strong></td>
            <td>${r.description ? escapeHTML(r.description) : "—"}</td>
            <td>
              <button class="btn btn-sm btn-success me-1"
                onclick="handleResolveReport('${r.id}', 'resolved')"
                data-i18n="admin.resolveReport">
                ${lang === "en" ? "Resolve" : "Реши"}
              </button>
              <button class="btn btn-sm btn-secondary"
                onclick="handleResolveReport('${r.id}', 'dismissed')"
                data-i18n="admin.dismissReport">
                ${lang === "en" ? "Dismiss" : "Отхвърли"}
              </button>
            </td>
          </tr>`;
      })
      .join("");

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th data-i18n="admin.reportDate">${lang === "en" ? "Date" : "Дата"}</th>
              <th data-i18n="admin.reportedBy">${lang === "en" ? "Reported by" : "Докладвано от"}</th>
              <th data-i18n="admin.reportReason">${lang === "en" ? "Reason" : "Причина"}</th>
              <th data-i18n="admin.reportDescription">${lang === "en" ? "Description" : "Описание"}</th>
              <th data-i18n="admin.actions">${lang === "en" ? "Actions" : "Действия"}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch (e) {
    logger.error("Error loading reports:", e);
  }
}

/**
 * Resolve or dismiss a report.
 * @param {string} reportId
 * @param {'resolved'|'dismissed'} newStatus
 */
async function handleResolveReport(reportId, newStatus) {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  const { error } = await supabase
    .from("reports")
    .update({
      status: newStatus,
      reviewed_by: currentUser?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    await Swal.fire({ icon: "error", title: t("common.error"), text: error.message });
    return;
  }

  const msg =
    newStatus === "resolved"
      ? lang === "en"
        ? "Report resolved."
        : "Докладът е разрешен."
      : lang === "en"
        ? "Report dismissed."
        : "Докладът е отхвърлен.";

  await Swal.fire({
    icon: "success",
    title: t("common.success"),
    text: msg,
    timer: 1500,
    showConfirmButton: false,
  });
  await loadReports();
}

// Expose functions to window for onclick handlers
window.handleLogout = handleLogout;
window.handleApprove = handleApprove;
window.handleReject = handleReject;
window.showPhotoModal = showPhotoModal;
window.closePhotoModal = closePhotoModal;
window.handleResolveReport = handleResolveReport;
window.renderPendingTable = renderPendingTable;
Object.defineProperty(window, "pendingCurrentPage", {
  get: () => pendingCurrentPage,
  set: (v) => {
    pendingCurrentPage = v;
  },
});
