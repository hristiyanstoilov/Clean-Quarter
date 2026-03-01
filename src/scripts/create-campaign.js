import L from "leaflet";
import { initializeMap, createMarkerIcon } from "../services/map.js";
import { uploadCampaignPhoto } from "../services/storage.js";
import { initI18n, applyLanguage, setLanguage } from "../utils/i18n.js";
import { showSuccessToast, initSwalFallback } from "../utils/helpers.js";
import supabase from "../services/supabase.js";

// Global variables
let map = null;
let selectedCoordinates = { lat: null, lng: null };
let beforePhotoFile = null;
let currentUser = null;

/**
 * Initialize the page on load
 */
window.addEventListener("DOMContentLoaded", async () => {
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
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && user.role === "admin") {
      const adminNavItem = document.getElementById("adminNavItem");
      if (adminNavItem) adminNavItem.style.display = "block";
    }

    await checkAuth();
    // Always register event listeners regardless of map status
    setupEventListeners();
    setTimeout(() => {
      try {
        initMap();
      } catch (mapError) {
        const mapEl = document.getElementById("map");
        if (mapEl) {
          mapEl.style.cssText =
            "display:flex;align-items:center;justify-content:center;background:#f8f9fa;color:#6c757d;font-size:0.9rem;";
          mapEl.textContent = "Картата не може да се зареди. Проверете интернет връзката.";
        }
      }
    }, 300);
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
 * Initialize the map
 */
function initMap() {
  window.addEventListener("resize", () => {
    if (map) map.invalidateSize();
  });
  map = initializeMap();
  // Fix Leaflet rendering bug: ensure map fills container
  setTimeout(() => {
    map.invalidateSize();
    // Center map and show marker if coordinates are already selected
    if (selectedCoordinates.lat && selectedCoordinates.lng) {
      map.setView([selectedCoordinates.lat, selectedCoordinates.lng], 16);
      map.invalidateSize();
      if (window.selectionMarker) {
        map.removeLayer(window.selectionMarker);
      }
      window.selectionMarker = L.marker([selectedCoordinates.lat, selectedCoordinates.lng], {
        icon: createMarkerIcon("blue"),
      })
        .addTo(map)
        .bindPopup("📍 Избрана локация")
        .openPopup();
      map.invalidateSize();
    }
  }, 300);

  // Add click event to map to select coordinates
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    selectedCoordinates = { lat, lng };
    document.getElementById("latitude").textContent = lat.toFixed(6);
    document.getElementById("longitude").textContent = lng.toFixed(6);
    document.getElementById("coordinatesDisplay").style.display = "block";
    // Add or update marker
    if (window.selectionMarker) {
      map.removeLayer(window.selectionMarker);
    }
    window.selectionMarker = L.marker([lat, lng], {
      icon: createMarkerIcon("blue"),
    })
      .addTo(map)
      .bindPopup("📍 Избрана локация")
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
  // File input change
  document.getElementById("beforePhoto").addEventListener("change", handleFileSelect);

  // Form submission
  document.getElementById("createCampaignForm").addEventListener("submit", handleFormSubmit);

  // Enable submit button when all fields are filled
  document.getElementById("campaignTitleBg").addEventListener("input", checkFormCompletion);
  document.getElementById("campaignDescriptionBg").addEventListener("input", checkFormCompletion);
  document.getElementById("campaignNeighborhood").addEventListener("change", checkFormCompletion);
}

/**
 * Handle file selection for before photo
 */
function handleFileSelect(e) {
  beforePhotoFile = e.target.files[0];
  const fileName = beforePhotoFile ? beforePhotoFile.name : "No file chosen";

  document.getElementById("beforePhotoName").textContent = fileName;

  // Show preview
  if (beforePhotoFile) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById("beforePhotoPreview");
      preview.src = event.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(beforePhotoFile);
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
  const hasFile = beforePhotoFile !== null;
  const hasCoordinates = selectedCoordinates.lat !== null && selectedCoordinates.lng !== null;

  const isComplete = titleBg && descBg && nbh && hasFile && hasCoordinates;

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
  });

  // Show helpful message if not complete
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const isBg = lang === "bg";

  if (!isComplete) {
    const missing = [];
    if (!titleBg) missing.push(isBg ? "Заглавие" : "Title");
    if (!descBg) missing.push(isBg ? "Описание" : "Description");
    if (!nbh) missing.push(isBg ? "Квартал" : "Neighborhood");
    if (!hasFile) missing.push(isBg ? "Снимка" : "Photo");
    if (!hasCoordinates) missing.push(isBg ? "Локация на картата" : "Map location");

    submitBtn.title = (isBg ? "Моля попълнете: " : "Please fill in: ") + missing.join(", ");
    submitBtn.style.cursor = "not-allowed";
  } else {
    submitBtn.title = isBg ? "Кликни за създаване на кампания" : "Click to create campaign";
    submitBtn.style.cursor = "pointer";
  }
}

/**
 * Update visual checklist showing what's complete and what's missing
 */
function updateVisualChecklist(status) {
  const lang = localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
  const isBg = lang === "bg";

  let checklist = document.getElementById("requirementsChecklist");

  // Create checklist if it doesn't exist
  if (!checklist) {
    checklist = document.createElement("div");
    checklist.id = "requirementsChecklist";
    checklist.style.cssText =
      "background: #fff3cd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #ffc107;";

    const submitSection = document.querySelector(".btn-submit").parentElement;
    submitSection.insertBefore(checklist, submitSection.firstChild);
  }

  const items = [
    { key: "titleBg", label: isBg ? "📝 Заглавие" : "📝 Title" },
    { key: "descBg", label: isBg ? "📄 Описание" : "📄 Description" },
    { key: "nbh", label: isBg ? "📍 Квартал" : "📍 Neighborhood" },
    { key: "hasFile", label: isBg ? "📸 Снимка" : "📸 Photo" },
    { key: "hasCoordinates", label: isBg ? "🗺️ Локация на картата" : "🗺️ Map location" },
  ];

  const completed = items.filter((item) => status[item.key]).length;
  const total = items.length;

  const headingText = isBg ? "📋 Задължителни полета" : "📋 Required Fields";
  const readyText = isBg ? "✅ Готово за изпращане!" : "✅ Ready to submit!";
  const incompleteText = isBg ? "⚠️ Непълно" : "⚠️ Incomplete";

  checklist.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
      <h6 style="margin: 0; color: #856404; font-weight: bold;">${headingText} (${completed}/${total})</h6>
      <span style="font-size: 0.9rem; color: #856404;">${completed === total ? readyText : incompleteText}</span>
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

    // Basic validation
    if (!titleBg || !descBg || !nbhBg || lat === null || lng === null || !beforePhotoFile) {
      throw new Error("Моля попълнете всички полета и изберете локация на картата");
    }

    // Check if we're in demo mode
    const localUser = localStorage.getItem("user");
    const isDemoMode = localUser && currentUser.id === "demo-admin-001";

    if (isDemoMode) {
      // DEMO MODE: Create campaign in localStorage
      const demoCampaigns = JSON.parse(
        localStorage.getItem("CLEAN_QUARTER_DEMO_CAMPAIGNS") || "[]"
      );
      const newCampaignId = "demo_" + Date.now();

      // Create demo photo URL (SVG data URL)
      const beforePhotoUrl =
        "data:image/svg+xml;base64," +
        btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
                      <rect width="400" height="300" fill="#90EE90"/>
                      <text x="200" y="150" font-size="24" text-anchor="middle" fill="#333">Before Photo</text>
                      <text x="200" y="180" font-size="16" text-anchor="middle" fill="#666">${titleBg}</text>
                  </svg>
              `);

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
        status: "active",
        created_at: new Date().toISOString(),
        participation_count: 0,
      };

      demoCampaigns.push(newCampaign);
      localStorage.setItem("CLEAN_QUARTER_DEMO_CAMPAIGNS", JSON.stringify(demoCampaigns));

      // Auto-join creator as first participant (demo mode)
      const demoParts = JSON.parse(
        localStorage.getItem("CLEAN_QUARTER_DEMO_PARTICIPATIONS") || "[]"
      );
      demoParts.push({
        id: `part-${Date.now()}`,
        campaign_id: newCampaignId,
        user_id: currentUser.id,
        status: "pending",
        after_photo_url: null,
        points_earned: 0,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("CLEAN_QUARTER_DEMO_PARTICIPATIONS", JSON.stringify(demoParts));

      await showSuccessToast("Кампанията е създадена успешно!");

      window.location.href = "/dashboard";
    } else {
      // REAL MODE: Use Supabase
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const beforePhotoUrl = await uploadCampaignPhoto(beforePhotoFile, "before");

      Swal.close();

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
            status: "active",
          },
        ])
        .select();

      if (campaignError) {
        throw new Error(`Failed to create campaign: ${campaignError.message}`);
      }

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

      await showSuccessToast("Кампанията е създадена успешно!");

      // Redirect to dashboard
      window.location.href = "/dashboard";
    }
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: (localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg") === "en" ? "Error" : "Грешка",
      text:
        error.message ||
        ((localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg") === "en"
          ? "Failed to create campaign. Please try again."
          : "Неуспешно създаване. Опитай отново."),
    });
  } finally {
    // Re-enable submit button and hide spinner
    submitBtn.disabled = false;
    spinner.style.display = "none";
    checkFormCompletion();
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

// Expose handleLogout to window for onclick handler
window.handleLogout = handleLogout;
