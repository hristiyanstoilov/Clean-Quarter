import L from "leaflet";
import supabase from "../services/supabase.js";
import { initializeMap, createMarkerIcon } from "../services/map.js";
import { uploadCampaignPhoto } from "../services/storage.js";
import { compressImage } from "../services/compressor.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import {
  escapeHTML,
  showSuccessToast,
  showInfoToast,
  initSwalFallback,
  formatScheduledDate,
} from "../utils/helpers.js";
import {
  isDemoUser,
  getDemoCampaignById,
  getDemoParticipations,
  addDemoParticipation,
  updateDemoParticipation,
  updateDemoCampaign,
  getDemoComments,
  addDemoComment,
  softDeleteDemoComment,
  getDemoRsvps,
  addDemoRsvp,
  removeDemoRsvp,
} from "../utils/demoMode.js";
import { rsvpToCampaign, cancelRsvp, getRsvpCount, getUserRsvp } from "../services/events.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";

// Global variables
let campaign = null;
let currentUser = null;
let map = null;
let userParticipation = null;
let afterPhotoFile = null;
let commentsChannel = null;
let rsvpCount = 0;
let userHasRsvpd = false;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  initNetworkStatusBanner();
  initSwalFallback();
  try {
    // Initialize i18n (realTime = false)
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
    }

    await checkAuth();
    await loadCampaignDetail();
  } catch (error) {
    document.getElementById("errorState").style.display = "block";
    document.getElementById("errorMessage").textContent = error.message;
  }
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  // First check localStorage for demo user
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      return;
    } catch {
      // silently ignore
    }
  }

  // Then try Supabase auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "/";
    return;
  }

  // Fetch profile to get role and username for comment moderation and display
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  currentUser = { ...user, role: profile?.role, username: profile?.username };
}

/**
 * Get campaign ID from URL parameters
 */
function getCampaignIdFromUrl() {
  // In dev (Vite), ID is passed as ?id= query param after redirect.
  // In production (Netlify 200 rewrite), ID is the last path segment.
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id");
  const segments = window.location.pathname.split("/");
  return segments[segments.length - 1] || null;
}

/**
 * Load and display campaign details
 */
async function loadCampaignDetail() {
  try {
    const campaignId = getCampaignIdFromUrl();

    if (!campaignId) {
      throw new Error("Campaign ID not provided in URL");
    }

    // Check if in demo mode
    let campaignData = null;
    let participations = [];
    let userPart = null;
    let userPartError = null;

    if (isDemoUser(currentUser)) {
      // Load demo campaign from localStorage
      campaignData = getDemoCampaignById(campaignId);

      if (!campaignData) {
        throw new Error("Campaign not found in demo data");
      }

      // Load demo participations
      participations = getDemoParticipations().filter((p) => p.campaign_id === campaignId);

      userPart = participations.find((p) => p.user_id === currentUser.id) || null;
    } else {
      // Fetch campaign data from Supabase (join creator profile for username display)
      const { data, error: campaignError } = await supabase
        .from("campaigns")
        .select("*, creator:profiles!created_by(username)")
        .eq("id", campaignId)
        .single();

      if (campaignError) {
        throw new Error(`Campaign not found: ${campaignError.message}`);
      }

      campaignData = data;

      // Fetch participation statistics
      const { data: parts, error: participationError } = await supabase
        .from("participations")
        .select("id, status, user_id, after_photo_url")
        .eq("campaign_id", campaignId);

      if (participationError) {
        // silently ignore
      } else {
        participations = parts;
      }

      // Fetch current user's participation
      const { data: userPartData, error: userPartErr } = await supabase
        .from("participations")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", currentUser.id)
        .single();

      userPartError = userPartErr;
      if (!userPartError) {
        userPart = userPartData;
      }
    }

    campaign = campaignData;

    if (!userPartError && userPart) {
      userParticipation = userPart;
    }

    // Fetch RSVP data
    if (isDemoUser(currentUser)) {
      const rsvps = getDemoRsvps().filter((r) => r.campaign_id === campaignId);
      rsvpCount = rsvps.length;
      userHasRsvpd = rsvps.some((r) => r.user_id === currentUser.id);
    } else {
      [rsvpCount, userHasRsvpd] = await Promise.all([
        getRsvpCount(campaignId),
        getUserRsvp(campaignId, currentUser.id).then((r) => !!r),
      ]);
    }

    // Display the campaign details
    displayCampaignDetails(campaign, participations || []);

    // Check delete eligibility and show button if applicable
    await checkDeleteEligibility(campaignId, participations || []);

    // Show participation UI
    showParticipationUI();

    // Show RSVP UI
    showRsvpUI();

    // Load comments
    await loadComments();

    // Setup file input listener (with null check)
    document.getElementById("afterPhoto")?.addEventListener("change", handleAfterPhotoSelect);

    // Hide loading, show content
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("campaignContent").style.display = "block";
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Display campaign details on the page
 */
function displayCampaignDetails(campaignData, participations) {
  // Get current language (default bg)
  let lang = "bg";
  try {
    lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  } catch {}

  // Title (bilingual support)
  let title = campaignData.title;
  // Parse JSON if it's a string
  if (typeof title === "string") {
    try {
      title = JSON.parse(title);
    } catch {
      // If parsing fails, use as-is
    }
  }
  if (title && typeof title === "object")
    title = title[lang] || title.bg || Object.values(title)[0];
  document.getElementById("campaignTitle").textContent = title;

  // Before Photo
  const photoElement = document.getElementById("beforePhoto");
  photoElement.src = campaignData.before_photo_url;
  photoElement.alt = `Before photo for ${title}`;

  // Status
  const statusBadge = document.getElementById("statusBadge");
  statusBadge.textContent =
    campaignData.status.charAt(0).toUpperCase() + campaignData.status.slice(1);
  statusBadge.className = `badge-status badge-${campaignData.status}`;

  // Description (bilingual support)
  let desc = campaignData.description;
  // Parse JSON if it's a string
  if (typeof desc === "string") {
    try {
      desc = JSON.parse(desc);
    } catch {
      // If parsing fails, use as-is
    }
  }
  if (desc && typeof desc === "object") desc = desc[lang] || desc.bg || Object.values(desc)[0];
  document.getElementById("campaignDescription").textContent = desc;

  // Neighborhood (bilingual support)
  let nbh = campaignData.neighborhood;
  // Parse JSON if it's a string
  if (typeof nbh === "string") {
    try {
      nbh = JSON.parse(nbh);
    } catch {
      // If parsing fails, use as-is
    }
  }
  if (nbh && typeof nbh === "object") nbh = nbh[lang] || nbh.bg || Object.values(nbh)[0];
  document.getElementById("campaignNeighborhood").textContent = nbh;

  // Category
  const categoryEl = document.getElementById("campaignCategory");
  if (categoryEl) {
    const categoryMap = {
      park: lang === "en" ? "🌳 Park" : "🌳 Парк",
      street: lang === "en" ? "🛣️ Street" : "🛣️ Улица",
      water: lang === "en" ? "💧 Water" : "💧 Воден обект",
      other: lang === "en" ? "📦 Other" : "📦 Друго",
    };
    categoryEl.textContent = campaignData.category
      ? categoryMap[campaignData.category] || campaignData.category
      : lang === "en"
        ? "—"
        : "—";
  }

  // Scheduled date + time range
  const scheduledEl = document.getElementById("campaignScheduled");
  if (scheduledEl) {
    const formatted = formatScheduledDate(campaignData, lang, "long");
    scheduledEl.textContent = formatted || t("campaign.noDate") || "Time TBD";
  }

  // Created date
  const createdDate = new Date(campaignData.created_at);
  const dateLocale = lang === "bg" ? "bg-BG" : "en-US";
  document.getElementById("campaignDate").textContent = createdDate.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Created by (prefer joined username, fallback to UUID)
  document.getElementById("createdBy").textContent =
    campaignData.creator?.username || campaignData.created_by;

  // Participation stats
  const totalParticipants = participations.length;
  const approvedCount = participations.filter((p) => p.status === "approved").length;
  const pendingCount = participations.filter((p) => p.status === "pending").length;

  document.getElementById("participantCount").textContent = totalParticipants;
  document.getElementById("approvedCount").textContent = approvedCount;
  document.getElementById("pendingCount").textContent = pendingCount;

  // Location
  document.getElementById("latitude").textContent = campaignData.location_lat.toFixed(6);
  document.getElementById("longitude").textContent = campaignData.location_lng.toFixed(6);

  // Initialize map with campaign location — isolated so map failure never crashes the page
  try {
    initializeDetailMap(campaignData.location_lat, campaignData.location_lng);
  } catch {
    const mapEl = document.getElementById("map");
    if (mapEl) {
      mapEl.style.cssText =
        "display:flex;align-items:center;justify-content:center;background:#f8f9fa;color:#6c757d;font-size:0.9rem;height:200px;";
      mapEl.textContent = "Картата не може да се зареди.";
    }
  }
}

/**
 * Initialize map with campaign location
 */
function initializeDetailMap(lat, lng) {
  map = initializeMap();

  // Build popup content with title + scheduled date/time
  let popupTitle = campaign.title;
  try {
    const parsed = JSON.parse(popupTitle);
    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    if (typeof parsed === "object") popupTitle = parsed[lang] || parsed.bg || popupTitle;
  } catch {
    /* plain string */
  }

  const popupLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const popupDateStr = formatScheduledDate(campaign, popupLang, "short");
  const popupTime = popupDateStr ? `<br><small>📅 ${popupDateStr}</small>` : "";

  // Add marker for campaign location
  L.marker([lat, lng], {
    icon: createMarkerIcon("blue"),
  })
    .addTo(map)
    .bindPopup(`<strong>${escapeHTML(popupTitle)}</strong>${popupTime}`);

  // Center map on campaign location
  map.setView([lat, lng], 15);

  // Fix Leaflet rendering bug: ensure map fills container after visible
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

/**
 * Check if current user can delete the campaign
 * Requirements:
 * 1. Current user must be the campaign creator
 * 2. No other users have joined (creator's own auto-participation doesn't count)
 */
async function checkDeleteEligibility(_campaignId, participations) {
  const isCreator = currentUser.id === campaign.created_by;

  // Show edit button if user is creator
  if (isCreator) {
    document.getElementById("editCampaignBtn").style.display = "inline-block";
  }

  // Show report button for logged-in non-creators (not in demo mode)
  const isDemo = isDemoUser(currentUser);
  if (!isCreator && !isDemo) {
    document.getElementById("reportBtn").style.display = "inline-block";
  }

  // Allow delete if no external participants have joined
  // (creator's own participation with no after_photo doesn't block deletion)
  const externalParticipants = participations.filter((p) => p.user_id !== currentUser.id);
  const canDelete = isCreator && externalParticipants.length === 0;

  if (canDelete) {
    document.getElementById("deleteBtn").style.display = "inline-block";
  }
}

/**
 * Show participation UI based on user status
 */
function showParticipationUI() {
  const isCreator = currentUser.id === campaign.created_by;
  const joinSection = document.getElementById("joinSection");
  const uploadSection = document.getElementById("uploadSection");

  // Hide both sections by default
  joinSection.style.display = "none";
  uploadSection.style.display = "none";

  if (!userParticipation) {
    // Creator is auto-joined on campaign creation, so no join button for them
    if (!isCreator) {
      joinSection.style.display = "block";
    }
  } else {
    // User has joined (includes creator) — show upload section
    uploadSection.style.display = "block";

    // Show status message based on participation status
    showSubmissionStatus(userParticipation.status, userParticipation.rejection_reason);

    // If photo already uploaded and status is not rejected, disable upload
    if (userParticipation.after_photo_url && userParticipation.status !== "rejected") {
      document.getElementById("uploadPhotoForm").style.opacity = "0.6";
      document.getElementById("uploadPhotoForm").style.pointerEvents = "none";
      document.getElementById("uploadBtn").disabled = true;
    }
  }
}

/**
 * Handle joining campaign
 */
async function handleJoin() {
  const joinBtn = document.getElementById("joinBtn");

  try {
    joinBtn.disabled = true;

    const campaignId = getCampaignIdFromUrl();

    const isDemo = isDemoUser(currentUser);

    if (isDemo) {
      // Demo mode: save participation to localStorage
      const newPart = {
        id: `part-${Date.now()}`,
        campaign_id: campaignId,
        user_id: currentUser.id,
        status: "pending",
        after_photo_url: null,
        points_earned: 0,
        created_at: new Date().toISOString(),
      };
      addDemoParticipation(newPart);
      userParticipation = newPart;
    } else {
      // Real mode: use Supabase
      const { data: participation, error: joinError } = await supabase
        .from("participations")
        .insert([
          {
            campaign_id: campaignId,
            user_id: currentUser.id,
            status: "pending",
          },
        ])
        .select();

      if (joinError) {
        throw new Error(`Failed to join campaign: ${joinError.message}`);
      }

      userParticipation = participation[0];
    }

    // Show success message
    await showSuccessToast(t("campaign.joined"));

    // Update UI
    showParticipationUI();
  } catch (error) {
    const isAlreadyJoined =
      error.message?.includes("duplicate") || error.message?.includes("unique");
    if (isAlreadyJoined) {
      await showInfoToast(t("campaign.alreadyJoined"));
    } else {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.message || t("common.error"),
      });
    }

    joinBtn.disabled = false;
  }
}

/**
 * Handle after photo file selection
 */
function handleAfterPhotoSelect(e) {
  afterPhotoFile = e.target.files[0];
  const fileName = afterPhotoFile ? afterPhotoFile.name : "No file chosen";

  document.getElementById("afterPhotoName").textContent = fileName;

  // Show preview
  if (afterPhotoFile) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById("afterPhotoPreview");
      preview.src = event.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(afterPhotoFile);

    // Enable upload button
    document.getElementById("uploadBtn").disabled = false;
  } else {
    document.getElementById("uploadBtn").disabled = true;
  }
}

/**
 * Handle uploading after photo
 */
async function handleUploadPhoto() {
  const uploadBtn = document.getElementById("uploadBtn");

  try {
    if (!afterPhotoFile) {
      throw new Error("No file selected");
    }

    uploadBtn.disabled = true;

    // Show loading state (no await — fire-and-close pattern to avoid deadlock)
    Swal.fire({
      title: t("campaign.uploadingPhoto"),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const isDemo = isDemoUser(currentUser);
    let photoUrl;

    if (isDemo) {
      // Demo mode: convert to data URL instead of uploading to Supabase Storage
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(afterPhotoFile);
      });

      // Update participation in localStorage
      updateDemoParticipation(userParticipation.id, {
        after_photo_url: photoUrl,
        status: "pending",
      });
    } else {
      // Real mode: upload to Supabase Storage
      const compressedAfter = await compressImage(afterPhotoFile, 1200, 0.75);
      photoUrl = await uploadCampaignPhoto(compressedAfter, "after");

      const { error: updateError } = await supabase
        .from("participations")
        .update({
          after_photo_url: photoUrl,
          status: "pending",
        })
        .eq("id", userParticipation.id);

      if (updateError) {
        throw new Error(`Failed to update participation: ${updateError.message}`);
      }
    }

    Swal.close();

    // Update local state
    userParticipation.after_photo_url = photoUrl;
    userParticipation.status = "pending";

    // Show success
    await showSuccessToast(t("campaign.proofSubmitted"));

    // Show status message
    showSubmissionStatus("pending");

    // Disable upload form
    document.getElementById("uploadPhotoForm").style.opacity = "0.6";
    document.getElementById("uploadPhotoForm").style.pointerEvents = "none";
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || "Failed to upload photo. Please try again.",
    });

    uploadBtn.disabled = false;
  }
}

/**
 * Show submission status message
 */
function showSubmissionStatus(status, rejectionReason) {
  const statusDiv = document.getElementById("submissionStatus");
  statusDiv.style.display = "block";

  if (status === "joined") {
    statusDiv.className = "status-message status-pending";
    statusDiv.textContent = `📝 ${t("campaign.joined")}`;
  } else if (status === "pending") {
    statusDiv.className = "status-message status-pending";
    statusDiv.textContent = `⏳ ${t("campaign.proofSubmitted")}`;
  } else if (status === "approved") {
    statusDiv.className = "status-message status-approved";
    statusDiv.textContent = `✅ ${t("campaign.proofApproved")}`;
  } else if (status === "rejected") {
    statusDiv.className = "status-message status-rejected";
    const reasonText = rejectionReason
      ? ` ${t("campaign.rejectionReason")}: "${escapeHTML(rejectionReason)}"`
      : "";
    statusDiv.innerHTML = `❌ ${t("campaign.proofRejected")}${reasonText} ${t("campaign.tryAgain")}`;
  }
}

/**
 * Handle campaign deletion
 */
async function handleDelete() {
  const result = await Swal.fire({
    title: t("campaign.deleteTitle"),
    text: t("campaign.deleteText"),
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: t("campaign.deleteConfirm"),
    cancelButtonText: t("campaign.deleteCancel"),
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    // Show loading state (no await — fire-and-close pattern to avoid deadlock)
    Swal.fire({
      title: "Deleting campaign...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const campaignId = getCampaignIdFromUrl();

    // Delete the campaign from database
    // Note: CASCADE will delete related records
    const { error: deleteError } = await supabase.from("campaigns").delete().eq("id", campaignId);

    if (deleteError) {
      throw new Error(`Failed to delete campaign: ${deleteError.message}`);
    }

    // Success notification
    await showSuccessToast(t("campaign.deleteSuccess"));

    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || "Failed to delete campaign. Please try again.",
    });
  }
}

/**
 * Show error state
 */
function showError(message) {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("campaignContent").style.display = "none";
  document.getElementById("errorState").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
}

/**
 * Cleanup Realtime channel
 */
function cleanupRealtimeChannel() {
  if (commentsChannel) {
    supabase.removeChannel(commentsChannel);
    commentsChannel = null;
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  cleanupRealtimeChannel();
  const { error } = await supabase.auth.signOut();
  if (!error) {
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}

// Cleanup Realtime channel when navigating away
window.addEventListener("beforeunload", cleanupRealtimeChannel);

/**
 * Extract display value from a field that may be a plain string or a JSON bilingual object.
 * e.g. "Почистване" → "Почистване"
 *      '{"bg":"Почистване","en":"Cleanup"}' → "Почистване" (for lang=bg)
 */
function extractDisplayValue(value) {
  if (!value) return "";
  if (typeof value !== "string") return String(value);
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
      return parsed[lang] || parsed.bg || parsed.en || Object.values(parsed)[0] || "";
    }
  } catch {
    // Not JSON — use as-is
  }
  return value;
}

/**
 * Toggle edit campaign form
 */
function toggleEditCampaign() {
  const editSection = document.getElementById("editCampaignSection");

  if (editSection.style.display === "none") {
    // Show edit form — pre-fill with extracted display values (handles JSON bilingual format)
    editSection.style.display = "block";

    document.getElementById("editTitle").value = extractDisplayValue(campaign?.title);
    document.getElementById("editDescription").value = extractDisplayValue(campaign?.description);
    document.getElementById("editNeighborhood").value = campaign?.neighborhood || "Studentski Grad";
    document.getElementById("editStatus").value = campaign?.status || "active";
    document.getElementById("editScheduledDate").value = campaign?.scheduled_date || "";
    document.getElementById("editStartTime").value = campaign?.start_time?.slice(0, 5) || "";
    document.getElementById("editEndTime").value = campaign?.end_time?.slice(0, 5) || "";
    // Set min date to today
    document.getElementById("editScheduledDate").min = new Date().toISOString().split("T")[0];

    editSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    editSection.style.display = "none";
  }
}

/**
 * Handle save campaign changes
 */
async function handleSaveCampaign(e) {
  e.preventDefault();

  const newTitle = document.getElementById("editTitle").value.trim();
  const newDescription = document.getElementById("editDescription").value.trim();
  const newNeighborhood = document.getElementById("editNeighborhood").value;
  const newStatus = document.getElementById("editStatus").value;
  const newScheduledDate = document.getElementById("editScheduledDate").value;
  const newStartTime = document.getElementById("editStartTime").value;
  const newEndTime = document.getElementById("editEndTime").value || null;

  if (!newTitle || !newDescription) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: t("campaign.editRequiredFields"),
    });
    return;
  }

  if (newScheduledDate && newScheduledDate < new Date().toISOString().split("T")[0]) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: t("campaign.pastDateError") || "Date cannot be in the past",
    });
    return;
  }

  try {
    // Show loading
    Swal.fire({
      title: t("campaign.saving"),
      text: t("common.loading"),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const campaignId = getCampaignIdFromUrl();

    // Check if demo mode
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (localUser.id && localUser.id.startsWith("demo-")) {
      // Demo mode - update localStorage
      const updates = {
        title: newTitle,
        description: newDescription,
        neighborhood: newNeighborhood,
        status: newStatus,
        scheduled_date: newScheduledDate || null,
        start_time: newStartTime || null,
        end_time: newEndTime,
        updated_at: new Date().toISOString(),
      };
      updateDemoCampaign(campaignId, updates);

      // Preserve creator join data when updating campaign state
      const updatedCampaign = getDemoCampaignById(campaignId);
      if (updatedCampaign) {
        campaign = { ...updatedCampaign, creator: campaign.creator };
      }

      // Update UI (consistent with displayCampaignDetails)
      document.getElementById("campaignTitle").textContent = newTitle;
      document.getElementById("campaignDescription").textContent = newDescription;
      document.getElementById("campaignNeighborhood").textContent = newNeighborhood;

      const statusBadge = document.getElementById("statusBadge");
      statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      statusBadge.className = `badge-status badge-${newStatus}`;

      Swal.close();
      await showSuccessToast(t("campaign.updateSuccess"));

      toggleEditCampaign();
    } else {
      // Real mode - update Supabase
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          title: newTitle,
          description: newDescription,
          neighborhood: newNeighborhood,
          status: newStatus,
          scheduled_date: newScheduledDate || null,
          start_time: newStartTime || null,
          end_time: newEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
        .select()
        .single();

      if (error) throw error;

      // Preserve creator join data when updating campaign state
      campaign = { ...data, creator: campaign.creator };

      // Update UI (consistent with displayCampaignDetails)
      document.getElementById("campaignTitle").textContent = newTitle;
      document.getElementById("campaignDescription").textContent = newDescription;
      document.getElementById("campaignNeighborhood").textContent = newNeighborhood;

      const statusBadge = document.getElementById("statusBadge");
      statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      statusBadge.className = `badge-status badge-${newStatus}`;

      Swal.close();
      await showSuccessToast(t("campaign.updateSuccess"));

      toggleEditCampaign();
    }
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: error.message || "Error saving changes",
    });
  }
}

// Add event listener to edit form
document.getElementById("editCampaignForm")?.addEventListener("submit", handleSaveCampaign);

/**
 * Load comments for the current campaign
 */
async function loadComments() {
  const campaignId = getCampaignIdFromUrl();
  if (!campaignId) return;

  const isDemo = isDemoUser(currentUser);
  let comments = [];

  if (isDemo) {
    comments = getDemoComments(campaignId);
  } else {
    const { data, error } = await supabase
      .from("comments")
      .select("id, campaign_id, user_id, username, text, created_at")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!error) comments = data || [];
  }

  renderComments(comments);

  // Setup Realtime subscription for live comment updates (real mode only, once)
  const isRealMode = !isDemoUser(currentUser);
  if (isRealMode && !commentsChannel) {
    commentsChannel = supabase
      .channel(`comments-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadComments()
      )
      .subscribe();
  }

  // Show/hide add-comment form
  const addForm = document.getElementById("addCommentForm");
  const loginPrompt = document.getElementById("commentLoginPrompt");
  if (currentUser) {
    addForm.style.display = "block";
    loginPrompt.style.display = "none";
  } else {
    addForm.style.display = "none";
    loginPrompt.style.display = "block";
  }
}

/**
 * Render the comments list
 */
function renderComments(comments) {
  const list = document.getElementById("commentsList");
  if (!comments || comments.length === 0) {
    list.innerHTML =
      '<p class="text-muted" data-i18n="campaign.noComments">No comments yet. Be the first!</p>';
    return;
  }

  const isAdmin =
    currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  const commentLang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const commentLocale = commentLang === "bg" ? "bg-BG" : "en-US";
  list.innerHTML = comments
    .map((c) => {
      const isOwn =
        currentUser && (currentUser.id === c.user_id || currentUser.id?.toString() === c.user_id);
      const canDelete = isOwn || isAdmin;
      const date = new Date(c.created_at).toLocaleString(commentLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
        <div class="comment-item" id="comment-${escapeHTML(c.id)}">
          <div class="comment-header d-flex align-items-center gap-2 mb-1">
            <strong class="comment-username">${escapeHTML(c.username || "User")}</strong>
            <span class="comment-date text-muted" style="font-size:0.82rem">${date}</span>
            ${canDelete ? `<button class="btn btn-sm btn-link text-danger p-0 ms-auto" onclick="handleDeleteComment('${escapeHTML(c.id)}')" title="Delete">🗑️</button>` : ""}
          </div>
          <div class="comment-text">${escapeHTML(c.text)}</div>
        </div>
      `;
    })
    .join("");
}

/**
 * Handle posting a new comment
 */
async function handleAddComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  const campaignId = getCampaignIdFromUrl();
  const isDemo = isDemoUser(currentUser);
  const username =
    currentUser?.username ||
    currentUser?.user_metadata?.username ||
    currentUser?.email?.split("@")[0] ||
    "User";

  document.getElementById("postCommentBtn").disabled = true;

  try {
    if (isDemo) {
      addDemoComment({
        id: "demo_comment_" + Date.now(),
        campaign_id: campaignId,
        user_id: currentUser.id,
        username,
        text,
        created_at: new Date().toISOString(),
        deleted_at: null,
      });
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("comments").insert([
        {
          campaign_id: campaignId,
          user_id: user.id.toString(),
          username,
          text,
        },
      ]);

      if (error) {
        await Swal.fire({ icon: "error", title: t("common.error"), text: error.message });
        return;
      }
    }

    input.value = "";
    await showSuccessToast("Comment posted.");
    await loadComments();
  } finally {
    document.getElementById("postCommentBtn").disabled = false;
  }
}

/**
 * Handle deleting a comment (soft delete)
 */
async function handleDeleteComment(commentId) {
  const isDemo = isDemoUser(currentUser);

  if (isDemo) {
    softDeleteDemoComment(commentId);
  } else {
    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId);

    if (error) {
      await Swal.fire({ icon: "error", title: t("common.error"), text: error.message });
      return;
    }
  }

  await showSuccessToast("Comment deleted.");
  await loadComments();
}

/**
 * Handle campaign report — shows SweetAlert2 modal with reason picker,
 * then inserts a row into the reports table.
 */
async function handleReport() {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  const reasonOptions = {
    spam: lang === "en" ? "Spam" : "Спам",
    inappropriate: lang === "en" ? "Inappropriate content" : "Неподходящо съдържание",
    harassment: lang === "en" ? "Harassment" : "Тормоз",
    fake: lang === "en" ? "Fake campaign" : "Фалшива кампания",
    other: lang === "en" ? "Other" : "Друго",
  };

  const selectOptions = Object.entries(reasonOptions)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");

  const { value: formValues, isConfirmed } = await Swal.fire({
    title: lang === "en" ? "Report Campaign" : "Докладвай кампанията",
    html: `
      <div class="mb-3 text-start">
        <label class="form-label fw-semibold">${lang === "en" ? "Reason" : "Причина"}</label>
        <select id="reportReason" class="form-select">
          ${selectOptions}
        </select>
      </div>
      <div class="mb-1 text-start">
        <label class="form-label fw-semibold">${lang === "en" ? "Additional description (optional)" : "Допълнително описание (по желание)"}</label>
        <textarea id="reportDescription" class="form-control" rows="3"
          placeholder="${lang === "en" ? "Describe the issue..." : "Опиши проблема..."}"></textarea>
      </div>
    `,
    confirmButtonText: lang === "en" ? "Submit Report" : "Изпрати доклад",
    showCancelButton: true,
    cancelButtonText: lang === "en" ? "Cancel" : "Отказ",
    preConfirm: () => ({
      reason: document.getElementById("reportReason").value,
      description: document.getElementById("reportDescription").value.trim(),
    }),
  });

  if (!isConfirmed || !formValues) return;

  try {
    const { error } = await supabase.from("reports").insert({
      reported_by: currentUser.id,
      entity_type: "campaign",
      entity_id: campaign.id,
      reason: formValues.reason,
      description: formValues.description || null,
    });

    if (error) {
      const alreadyReported = error.message && error.message.includes("already reported");
      if (alreadyReported) {
        await Swal.fire({
          icon: "warning",
          title: lang === "en" ? "Already Reported" : "Вече докладвано",
          text:
            lang === "en"
              ? "You have already reported this in the last 24 hours."
              : "Вече си докладвал това в последните 24 часа.",
        });
        return;
      }
      throw error;
    }

    await Swal.fire({
      icon: "success",
      title: lang === "en" ? "Report Submitted" : "Докладвано",
      text:
        lang === "en"
          ? "Report submitted. We will review it shortly."
          : "Докладвано успешно. Ще разгледаме сигнала.",
      timer: 2000,
      showConfirmButton: false,
    });

    // Hide the report button after successful report
    document.getElementById("reportBtn").style.display = "none";
  } catch (error) {
    logger.error("Error submitting report:", error);
    await Swal.fire({
      icon: "error",
      title: lang === "en" ? "Error" : "Грешка",
      text: error.message,
    });
  }
}

/**
 * Show or hide the RSVP section based on campaign state and user context.
 * Only visible for campaigns with a scheduled date, and not shown to the creator.
 */
function showRsvpUI() {
  const section = document.getElementById("rsvpSection");
  if (!section) return;

  // Always update the stat counter regardless of campaign type or user role
  document.getElementById("rsvpCount").textContent = rsvpCount;

  // Action section only for scheduled campaigns and non-creators
  if (!campaign.scheduled_date) return;
  if (currentUser.id === campaign.created_by) return;

  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";

  let countText;
  if (lang === "en") {
    countText = rsvpCount === 1 ? "1 person plans to attend" : `${rsvpCount} people plan to attend`;
  } else {
    countText =
      rsvpCount === 1 ? "1 човек планира да дойде" : `${rsvpCount} души планират да дойдат`;
  }
  document.getElementById("rsvpCountText").textContent = countText;
  document.getElementById("rsvpBtn").style.display = userHasRsvpd ? "none" : "inline-block";
  document.getElementById("cancelRsvpBtn").style.display = userHasRsvpd ? "inline-block" : "none";
  section.style.display = "block";
}

/**
 * Handle RSVP to the current campaign
 */
async function handleRsvp() {
  const btn = document.getElementById("rsvpBtn");
  try {
    btn.disabled = true;
    const campaignId = getCampaignIdFromUrl();
    if (isDemoUser(currentUser)) {
      addDemoRsvp({
        id: `rsvp-${Date.now()}`,
        campaign_id: campaignId,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
      });
    } else {
      await rsvpToCampaign(campaignId, currentUser.id);
    }
    rsvpCount++;
    userHasRsvpd = true;
    showRsvpUI();
    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccessToast(
      lang === "en" ? "You're in! See you at the cleanup." : "Записан! Ще те видим на почистването."
    );
  } catch (error) {
    await Swal.fire({ icon: "error", title: "Грешка", text: error.message });
  } finally {
    btn.disabled = false;
  }
}

/**
 * Handle cancelling RSVP to the current campaign
 */
async function handleCancelRsvp() {
  const btn = document.getElementById("cancelRsvpBtn");
  try {
    btn.disabled = true;
    const campaignId = getCampaignIdFromUrl();
    if (isDemoUser(currentUser)) {
      removeDemoRsvp(campaignId, currentUser.id);
    } else {
      await cancelRsvp(campaignId, currentUser.id);
    }
    rsvpCount = Math.max(0, rsvpCount - 1);
    userHasRsvpd = false;
    showRsvpUI();
    const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
    await showSuccessToast(lang === "en" ? "RSVP cancelled." : "Отписан от събитието.");
  } catch (error) {
    await Swal.fire({ icon: "error", title: "Грешка", text: error.message });
  } finally {
    btn.disabled = false;
  }
}

// Expose functions to window for onclick handlers
window.handleLogout = handleLogout;
window.handleDelete = handleDelete;
window.handleJoin = handleJoin;
window.handleUploadPhoto = handleUploadPhoto;
window.toggleEditCampaign = toggleEditCampaign;
window.handleAddComment = handleAddComment;
window.handleDeleteComment = handleDeleteComment;
window.handleReport = handleReport;
window.handleRsvp = handleRsvp;
window.handleCancelRsvp = handleCancelRsvp;
