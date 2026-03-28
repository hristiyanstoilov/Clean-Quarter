import L from "leaflet";
import { initializeMap, createMarkerIcon } from "../services/map.js";
import { uploadCampaignPhoto } from "../services/storage.js";
import { compressImage } from "../services/compressor.js";
import { initI18n, applyLanguage, setLanguage, t } from "../utils/i18n.js";
import { showSuccessToast, initSwalFallback, removeUser } from "../utils/helpers.js";
import { logout } from "../services/auth.js";
import supabase from "../services/supabase.js";
import { isDemoUser, addDemoCampaign, addDemoParticipation } from "../utils/demoMode.js";
import { initNetworkStatusBanner } from "../utils/networkStatus.js";
import { initBottomNav } from "../hooks/index.js";
import { initPage } from "../utils/pageInit.js";
import { isWithinSofia } from "../utils/constants.js";

// Global variables
let map = null;
let selectedCoordinates = { lat: null, lng: null };
let beforePhotoFile = null;
let currentUser = null;
let selectionMarker = null;

const VALID_POINTS_VALUES = [10, 20, 30, 50];
let hasUserInteracted = false;
let isRedirecting = false;

/**
 * Initialize the page on load
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    initPage();
    initNetworkStatusBanner();
    initBottomNav();
    initSwalFallback();
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
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && user.role === "admin") {
      const adminNavItem = document.getElementById("adminNavItem");
      if (adminNavItem) adminNavItem.style.display = "block";
    }

    // Notification bell (skip demo users)
    if (user?.id && !isDemoUser(user)) {
      import("../services/notifications.js").then(({ initNotificationBell }) => {
        initNotificationBell(user.id);
      });
    }

    await checkAuth();
    // Always register event listeners regardless of map status
    setupEventListeners();
    setTimeout(() => {
      try {
        initMap();
      } catch (e) {
        console.error("Map init failed:", e);
        const mapEl = document.getElementById("map");
        if (mapEl) {
          mapEl.style.cssText =
            "display:flex;align-items:center;justify-content:center;background:#f8f9fa;color:#6c757d;font-size:0.9rem;";
          mapEl.textContent = t("createCampaign.mapLoadError");
        }
      }
    }, 300);
  } catch (e) {
    console.error("Page init failed:", e);
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
      console.warn("Failed to parse localStorage user:", e);
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
 * Initialize the map
 */
function onMapResize() {
  if (map) map.invalidateSize();
}

function initMap() {
  window.addEventListener("resize", onMapResize);
  window.addEventListener("beforeunload", () => window.removeEventListener("resize", onMapResize));
  map = initializeMap();
  // Fix Leaflet rendering bug: ensure map fills container
  setTimeout(() => {
    map.invalidateSize();
    // Center map and show marker if coordinates are already selected
    if (selectedCoordinates.lat && selectedCoordinates.lng) {
      map.setView([selectedCoordinates.lat, selectedCoordinates.lng], 16);
      map.invalidateSize();
      if (selectionMarker) {
        map.removeLayer(selectionMarker);
      }
      selectionMarker = L.marker([selectedCoordinates.lat, selectedCoordinates.lng], {
        icon: createMarkerIcon("blue"),
      })
        .addTo(map)
        .bindPopup(t("createCampaign.selectedLocationPopup"))
        .openPopup();
      map.invalidateSize();
    }
  }, 300);

  // Add click event to map to select coordinates
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (!isWithinSofia(lat, lng)) {
      const msg = t("campaign.outsideSofia");
      const tempMarker = L.marker([lat, lng]).addTo(map).bindPopup(msg).openPopup();
      setTimeout(() => map.removeLayer(tempMarker), 2500);
      return;
    }

    selectedCoordinates = { lat, lng };
    document.getElementById("latitude").textContent = lat.toFixed(6);
    document.getElementById("longitude").textContent = lng.toFixed(6);
    document.getElementById("coordinatesDisplay").style.display = "block";
    // Add or update marker
    if (selectionMarker) {
      map.removeLayer(selectionMarker);
    }
    selectionMarker = L.marker([lat, lng], {
      icon: createMarkerIcon("blue"),
    })
      .addTo(map)
      .bindPopup(t("createCampaign.selectedLocationPopup"))
      .openPopup();
    map.setView([lat, lng], 16);
    map.invalidateSize();
    checkFormCompletion();
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });

  // File input change
  document.getElementById("beforePhoto").addEventListener("change", handleFileSelect);

  // Form submission
  document.getElementById("createCampaignForm").addEventListener("submit", handleFormSubmit);

  // Enable submit button when all fields are filled
  const markInteracted = () => {
    hasUserInteracted = true;
  };
  document.getElementById("campaignTitleBg").addEventListener("input", () => {
    markInteracted();
    checkFormCompletion();
  });
  document.getElementById("campaignDescriptionBg").addEventListener("input", () => {
    markInteracted();
    checkFormCompletion();
  });
  document.getElementById("campaignNeighborhood").addEventListener("change", () => {
    markInteracted();
    checkFormCompletion();
  });
  document.getElementById("campaignDate").addEventListener("change", () => {
    markInteracted();
    checkFormCompletion();
  });
  document.getElementById("campaignStartTime").addEventListener("change", () => {
    markInteracted();
    checkFormCompletion();
  });

  // Set min date to today
  const todayStr = new Date().toISOString().split("T")[0];
  document.getElementById("campaignDate").min = todayStr;
}

/**
 * Handle file selection for before photo
 */
function handleFileSelect(e) {
  hasUserInteracted = true;
  beforePhotoFile = e.target.files[0];
  const preview = document.getElementById("beforePhotoPreview");

  document.getElementById("beforePhotoName").textContent = beforePhotoFile
    ? beforePhotoFile.name
    : t("campaign.noFileChosen");

  if (beforePhotoFile) {
    const reader = new FileReader();
    reader.onload = (event) => {
      preview.src = event.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(beforePhotoFile);
  } else {
    preview.src = "";
    preview.style.display = "none";
  }

  checkFormCompletion();
}

/**
 * Check if form is complete and enable submit button
 */
function checkFormCompletion() {
  const titleBg = document.getElementById("campaignTitleBg").value.trim();
  const descBg = document.getElementById("campaignDescriptionBg").value.trim();
  const nbh = document.getElementById("campaignNeighborhood").value;
  const hasFile = !!beforePhotoFile;
  const hasCoordinates = selectedCoordinates.lat !== null && selectedCoordinates.lng !== null;

  const scheduledDate = document.getElementById("campaignDate").value;
  const startTime = document.getElementById("campaignStartTime").value;
  const isComplete =
    titleBg && descBg && nbh && hasFile && hasCoordinates && scheduledDate && startTime;

  // Update submit button
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = !isComplete;

  // Update visual checklist
  updateVisualChecklist({
    titleBg,
    descBg,
    nbh,
    hasFile,
    hasCoordinates,
    scheduledDate,
    startTime,
  });

  if (!isComplete) {
    const missing = [];
    if (!titleBg) missing.push(t("createCampaign.fieldTitle"));
    if (!descBg) missing.push(t("createCampaign.fieldDescription"));
    if (!nbh) missing.push(t("createCampaign.fieldNeighborhood"));
    if (!hasFile) missing.push(t("createCampaign.fieldPhoto"));
    if (!hasCoordinates) missing.push(t("createCampaign.fieldLocation"));
    if (!scheduledDate) missing.push(t("createCampaign.fieldDate"));
    if (!startTime) missing.push(t("createCampaign.fieldStartTime"));

    submitBtn.title = t("createCampaign.fillInPrompt").replace("{{fields}}", missing.join(", "));
    submitBtn.style.cursor = "not-allowed";
  } else {
    submitBtn.title = t("createCampaign.clickToCreate");
    submitBtn.style.cursor = "pointer";
  }
}

/**
 * Update visual checklist showing what's complete and what's missing
 */
function updateVisualChecklist(status) {
  const checklist = document.getElementById("requirementsChecklist");
  if (!checklist || !hasUserInteracted) return;
  checklist.style.display = "block";

  const items = [
    { key: "titleBg", label: t("createCampaign.checklistTitle") },
    { key: "descBg", label: t("createCampaign.checklistDescription") },
    { key: "nbh", label: t("createCampaign.checklistNeighborhood") },
    { key: "hasFile", label: t("createCampaign.checklistPhoto") },
    { key: "hasCoordinates", label: t("createCampaign.checklistLocation") },
    { key: "scheduledDate", label: t("createCampaign.checklistDate") },
    { key: "startTime", label: t("createCampaign.checklistStartTime") },
  ];

  const completed = items.filter((item) => status[item.key]).length;
  const total = items.length;

  checklist.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
      <h6 style="margin: 0; color: #856404; font-weight: bold;">${t("createCampaign.checklistHeading")} (${completed}/${total})</h6>
      <span style="font-size: 0.9rem; color: #856404;">${completed === total ? t("createCampaign.checklistReady") : t("createCampaign.checklistIncomplete")}</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.4rem; font-size: 0.9rem;">
      ${items
        .map(
          (item) => `
        <div style="color: ${status[item.key] ? "#28a745" : "#dc3545"}; font-weight: ${status[item.key] ? "normal" : "500"};">
          ${status[item.key] ? "✅" : "❌"} ${item.label}
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }

  const submitBtn = document.getElementById("submitBtn");
  const spinner = document.getElementById("loadingSpinner");
  const uploadStatus = document.getElementById("uploadStatus");

  try {
    // Disable submit button and show spinner
    submitBtn.disabled = true;
    spinner.style.display = "inline";

    // Collect form data
    const titleBg = document.getElementById("campaignTitleBg").value.trim();
    const descBg = document.getElementById("campaignDescriptionBg").value.trim();
    const neighborhoodSelect = document.getElementById("campaignNeighborhood");
    const nbhBg = neighborhoodSelect.value;
    const { lat, lng } = selectedCoordinates;
    const scheduledDate = document.getElementById("campaignDate").value;
    const startTime = document.getElementById("campaignStartTime").value;
    const endTime = document.getElementById("campaignEndTime").value || null;
    const category = document.getElementById("campaignCategory").value || null;
    const maxParticipantsRaw = document.getElementById("campaignMaxParticipants")?.value;
    const maxParticipantsParsed = parseInt(maxParticipantsRaw, 10);
    const maxParticipants =
      maxParticipantsRaw && !isNaN(maxParticipantsParsed) && maxParticipantsParsed >= 1
        ? maxParticipantsParsed
        : null;
    const rawPoints = parseInt(document.getElementById("campaignPointsValue")?.value || "20", 10);
    const pointsValue = VALID_POINTS_VALUES.includes(rawPoints) ? rawPoints : 20;

    // Basic validation
    if (
      !titleBg ||
      !descBg ||
      !nbhBg ||
      lat === null ||
      lng === null ||
      !beforePhotoFile ||
      !scheduledDate ||
      !startTime
    ) {
      throw new Error(t("createCampaign.fillAllFields"));
    }

    // Minimum length validation
    if (titleBg.length < 5) {
      throw new Error(t("createCampaign.titleTooShort"));
    }
    if (descBg.length < 20) {
      throw new Error(t("createCampaign.descriptionTooShort"));
    }

    // Geographic validation — coordinates must be within Sofia
    if (!isWithinSofia(lat, lng)) {
      throw new Error(t("campaign.outsideSofia"));
    }

    // Date validation — cannot be in the past
    const today = new Date().toISOString().split("T")[0];
    if (scheduledDate < today) {
      throw new Error(t("campaign.pastDateError"));
    }

    // Time range validation — end time must be after start time
    if (endTime && endTime <= startTime) {
      throw new Error(t("campaign.endTimeBeforeStartError"));
    }

    // Check if we're in demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && isDemoUser(currentUser);

    if (isDemoMode) {
      // DEMO MODE: Create campaign in localStorage
      const newCampaignId = "demo_" + Date.now();

      // Create demo photo URL (SVG data URI — encodeURIComponent avoids btoa Cyrillic crash)
      const beforePhotoUrl =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <rect width="400" height="300" fill="#90EE90"/>
            <text x="200" y="150" font-size="24" text-anchor="middle" fill="#333">Before Photo (Demo)</text>
          </svg>`
        );

      const newCampaign = {
        id: newCampaignId,
        title: titleBg,
        description: descBg,
        location_lat: lat,
        location_lng: lng,
        before_photo_url: beforePhotoUrl,
        created_by: currentUser.id,
        creator_username: currentUser.username || "admin_demo",
        neighborhood: nbhBg,
        category: category,
        status: "active",
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        max_participants: maxParticipants,
        points_value: pointsValue,
        created_at: new Date().toISOString(),
        participation_count: 0,
      };

      addDemoCampaign(newCampaign);

      // Auto-join creator as first participant (demo mode)
      addDemoParticipation({
        id: `part-${Date.now()}`,
        campaign_id: newCampaignId,
        user_id: currentUser.id,
        status: "pending",
        after_photo_url: null,
        points_earned: 0,
        created_at: new Date().toISOString(),
      });

      await showSuccessToast(t("createCampaign.successToast"));

      window.location.href = "/dashboard";
    } else {
      // REAL MODE: Use Supabase
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(t("createCampaign.notAuthenticated"));
      }

      // Server-side rate limit: max 5 campaigns per 24 hours
      const { data: rateCheck, error: rateError } = await supabase.rpc(
        "check_campaign_rate_limit",
        {
          p_user_id: user.id,
        }
      );
      if (rateError) throw new Error(t("common.error"));
      if (rateCheck && !rateCheck.allowed) {
        await Swal.fire({
          icon: "warning",
          title: t("createCampaign.rateLimitTitle"),
          text: t("createCampaign.rateLimitText"),
          confirmButtonColor: "#28a745",
        });
        return;
      }

      uploadStatus.textContent = t("createCampaign.uploadingPhoto");
      uploadStatus.style.display = "block";
      const compressedBefore = await compressImage(beforePhotoFile, 1200, 0.75);
      const { url: beforePhotoUrl, path: beforePhotoPath } = await uploadCampaignPhoto(
        compressedBefore,
        "before"
      );
      uploadStatus.style.display = "none";

      // First-time creator check: if user has no previously approved/active campaigns,
      // put the campaign into moderation queue instead of making it immediately public.
      const { count: previousCampaigns, error: countError } = await supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .in("status", ["active", "completed"]);
      if (countError) throw new Error(t("createCampaign.createError"));
      const campaignStatus = previousCampaigns > 0 ? "active" : "pending_review";

      // Insert campaign into database
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert([
          {
            title: titleBg,
            description: descBg,
            location_lat: lat,
            location_lng: lng,
            before_photo_url: beforePhotoUrl,
            created_by: user.id,
            neighborhood: nbhBg,
            category: category,
            status: campaignStatus,
            scheduled_date: scheduledDate,
            start_time: startTime,
            end_time: endTime,
            max_participants: maxParticipants,
            points_value: pointsValue,
          },
        ])
        .select();

      if (campaignError) {
        // Clean up the already-uploaded photo to avoid orphaned storage files
        supabase.storage
          .from("campaign-photos")
          .remove([beforePhotoPath])
          .catch((e) => console.warn("Orphan photo cleanup failed:", e.message));
        console.error("Campaign insert failed:", campaignError);
        throw new Error(t("createCampaign.createError"));
      }

      if (!campaign?.length) {
        console.error("Campaign insert returned no data", { campaignStatus, userId: user.id });
        throw new Error(t("createCampaign.createError"));
      }

      // Record creation for rate limiting (fire-and-forget — non-critical)
      supabase
        .rpc("record_campaign_creation", { p_user_id: user.id })
        .catch((e) => console.warn("Rate limit recording failed:", e.message));

      // Auto-join creator as first participant
      const { error: participationError } = await supabase.from("participations").insert([
        {
          campaign_id: campaign[0].id,
          user_id: user.id,
          status: "pending",
        },
      ]);

      if (participationError) {
        // Non-critical: campaign is created, just log the error
        console.warn("Could not auto-join creator:", participationError.message);
      }

      if (campaignStatus === "pending_review") {
        await Swal.fire({
          icon: "success",
          title: t("createCampaign.pendingReviewTitle"),
          text: t("createCampaign.pendingReviewText"),
          confirmButtonColor: "#28a745",
          confirmButtonText: t("common.great"),
        });
      } else {
        await showSuccessToast(t("createCampaign.successToast"));
      }

      // Redirect to dashboard
      isRedirecting = true;
      window.location.href = "/dashboard";
    }
  } catch (error) {
    const userMsg =
      (error.message || "").replace(/^\[.*?\]\s*/, "") || t("createCampaign.createError");
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: userMsg,
    });
  } finally {
    // Re-enable submit button and hide spinner
    submitBtn.disabled = false;
    spinner.style.display = "none";
    uploadStatus.style.display = "none";
    uploadStatus.textContent = "";
    if (!isRedirecting) checkFormCompletion();
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
  } catch (e) {
    console.error("Logout failed:", e);
    await Swal.fire({
      icon: "error",
      title: t("common.error"),
      text: t("auth.logoutError"),
    });
  }
}
