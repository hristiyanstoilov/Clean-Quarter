// Supabase will be dynamically imported inside functions to allow mocking in tests
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { isEmpty, escapeHTML } from "../utils/helpers.js";
import { hasLocalStorage } from "../utils/env.js";
import logger from "./logger.js";
import { isDemoUser, getDemoCampaigns } from "../utils/demoMode.js";

// Studentski Grad center coordinates
const STUDENTSKI_GRAD_CENTER = {
  lat: 42.6977,
  lng: 23.3219,
};

// Color map for each marker type
const MARKER_TYPE_COLORS = {
  campaign: "red",
  disposal: "green",
};

/**
 * Create a colored SVG map marker icon using L.divIcon.
 * No external image dependencies — works offline and without CDN.
 * @param {string} color - 'red' | 'green' | 'blue'
 * @returns {L.DivIcon}
 */
export function createMarkerIcon(color) {
  const colorMap = { red: "#e74c3c", green: "#27ae60", blue: "#2980b9" };
  const fill = colorMap[color] || "#e74c3c";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">' +
    `<path fill="${fill}" stroke="white" stroke-width="1" d="M12 1C6.48 1 2 5.48 2 11c0 7 10 23 10 23s10-16 10-23c0-5.52-4.48-10-10-10z"/>` +
    '<circle cx="12" cy="11" r="4" fill="white"/>' +
    "</svg>";
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

/**
 * Initialize the map centered on Studentski Grad
 * @returns {Object} Leaflet map instance
 */
export function initializeMap() {
  const map = L.map("map").setView([STUDENTSKI_GRAD_CENTER.lat, STUDENTSKI_GRAD_CENTER.lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Create a marker with icon and popup, added to a layer (map or cluster group)
 * @private
 * @param {Object} layer - Leaflet map or cluster group to add marker to
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} iconType - Type of icon ('campaign' or 'disposal')
 * @param {string} popupContent - HTML content for popup
 */
function createMarker(layer, lat, lng, iconType, popupContent) {
  const color = MARKER_TYPE_COLORS[iconType] || "red";
  const marker = L.marker([lat, lng], {
    icon: createMarkerIcon(color),
  });
  marker.bindPopup(popupContent);
  layer.addLayer ? layer.addLayer(marker) : marker.addTo(layer);
  return marker;
}

/**
 * Fetch active campaigns and display them as clustered RED markers.
 * Campaign markers are grouped via L.markerClusterGroup so the map
 * stays readable at any zoom level regardless of campaign count.
 * @param {Object} map - Leaflet map instance
 */
export async function loadCampaignMarkers(map) {
  try {
    const clusterGroup = L.markerClusterGroup();

    // Check if in demo mode
    const user = hasLocalStorage() ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    if (isDemoUser(user)) {
      // Load demo campaigns from localStorage
      const campaigns = hasLocalStorage() ? getDemoCampaigns() : [];

      if (!isEmpty(campaigns)) {
        campaigns.forEach((campaign) => {
          const popupContent = `
            <strong>${escapeHTML(campaign.title)}</strong><br>
            Status: ${escapeHTML(campaign.status)}<br>
            <small>ID: ${escapeHTML(campaign.id)}</small>
          `;
          createMarker(
            clusterGroup,
            campaign.location_lat,
            campaign.location_lng,
            "campaign",
            popupContent
          );
        });
      }
      map.addLayer(clusterGroup);
      return;
    }

    // Dynamically import Supabase to allow mocking in tests
    const supabaseModule = await import("./supabase.js");
    const supabase = supabaseModule.default || supabaseModule;
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("id, title, location_lat, location_lng, status")
      .eq("status", "active");

    if (error) throw error;

    if (!isEmpty(campaigns)) {
      campaigns.forEach((campaign) => {
        const popupContent = `
          <strong>${escapeHTML(campaign.title)}</strong><br>
          Status: ${escapeHTML(campaign.status)}<br>
          <small>ID: ${escapeHTML(campaign.id)}</small>
        `;
        createMarker(
          clusterGroup,
          campaign.location_lat,
          campaign.location_lng,
          "campaign",
          popupContent
        );
      });
    }

    map.addLayer(clusterGroup);
  } catch (error) {
    logger.error("Error loading campaign markers:", error);
  }
}

/**
 * Fetch disposal points and display them as GREEN markers
 * @param {Object} map - Leaflet map instance
 */
export async function loadDisposalPointMarkers(map) {
  try {
    // Check if in demo mode - skip disposal points for demo
    const user = hasLocalStorage() ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    if (isDemoUser(user)) {
      logger.info("📝 Demo mode: skipping disposal points");
      return;
    }

    // Dynamically import Supabase to allow mocking in tests
    const supabaseModule = await import("./supabase.js");
    const supabase = supabaseModule.default || supabaseModule;
    const { data: disposalPoints, error } = await supabase
      .from("disposal_points")
      .select("id, name, description, latitude, longitude");

    if (error) throw error;

    if (isEmpty(disposalPoints)) return;

    disposalPoints.forEach((point) => {
      const popupContent = `
        <strong>${escapeHTML(point.name)}</strong><br>
        ${point.description ? `${escapeHTML(point.description)}<br>` : ""}
        <small>ID: ${escapeHTML(point.id)}</small>
      `;

      createMarker(map, point.latitude, point.longitude, "disposal", popupContent);
    });
  } catch (error) {
    logger.error("Error loading disposal point markers:", error);
  }
}

/**
 * Load all map data (campaigns and disposal points)
 * @param {Object} map - Leaflet map instance
 */
export async function loadMapData(map) {
  await loadCampaignMarkers(map);
  await loadDisposalPointMarkers(map);
}
