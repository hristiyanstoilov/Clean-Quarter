import supabase from './supabase.js';
import { isEmpty } from '../utils/helpers.js';

// Studentski Grad center coordinates
const STUDENTSKI_GRAD_CENTER = {
  lat: 42.6977,
  lng: 23.3219
};

// Marker icon configurations
const MARKER_ICONS = {
  campaign: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    color: 'red'
  },
  disposal: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    color: 'green'
  }
};

const MARKER_CONFIG = {
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
};

/**
 * Initialize the map centered on Studentski Grad
 * @returns {Object} Leaflet map instance
 */
export function initializeMap() {
  const map = L.map('map').setView([STUDENTSKI_GRAD_CENTER.lat, STUDENTSKI_GRAD_CENTER.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Create a marker with icon and popup
 * @private
 * @param {Object} map - Leaflet map instance
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} iconType - Type of icon ('campaign' or 'disposal')
 * @param {string} popupContent - HTML content for popup
 */
function createMarker(map, lat, lng, iconType, popupContent) {
  const iconConfig = MARKER_ICONS[iconType];
  
  const marker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: iconConfig.iconUrl,
      ...MARKER_CONFIG
    })
  }).addTo(map);

  marker.bindPopup(popupContent);
  return marker;
}

/**
 * Fetch active campaigns and display them as RED markers
 * @param {Object} map - Leaflet map instance
 */
export async function loadCampaignMarkers(map) {
  try {
    // Check if in demo mode
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.id === 'demo-admin-001') {
      // Load demo campaigns from localStorage
      const campaigns = JSON.parse(localStorage.getItem('CLEAN_QUARTER_DEMO_CAMPAIGNS') || '[]');
      
      if (isEmpty(campaigns)) return;

      campaigns.forEach(campaign => {
        const popupContent = `
          <strong>${campaign.title}</strong><br>
          Status: ${campaign.status}<br>
          <small>ID: ${campaign.id}</small>
        `;
        
        createMarker(map, campaign.location_lat, campaign.location_lng, 'campaign', popupContent);
      });
      return;
    }

    // Load from Supabase
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, title, location_lat, location_lng, status')
      .eq('status', 'active');

    if (error) throw error;

    if (isEmpty(campaigns)) return;

    campaigns.forEach(campaign => {
      const popupContent = `
        <strong>${campaign.title}</strong><br>
        Status: ${campaign.status}<br>
        <small>ID: ${campaign.id}</small>
      `;
      
      createMarker(map, campaign.location_lat, campaign.location_lng, 'campaign', popupContent);
    });

  } catch (error) {
    console.error('Error loading campaign markers:', error);
  }
}

/**
 * Fetch disposal points and display them as GREEN markers
 * @param {Object} map - Leaflet map instance
 */
export async function loadDisposalPointMarkers(map) {
  try {
    // Check if in demo mode - skip disposal points for demo
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.id === 'demo-admin-001') {
      console.log('📝 Demo mode: skipping disposal points');
      return;
    }

    const { data: disposalPoints, error } = await supabase
      .from('disposal_points')
      .select('id, name, description, latitude, longitude');

    if (error) throw error;

    if (isEmpty(disposalPoints)) return;

    disposalPoints.forEach(point => {
      const popupContent = `
        <strong>${point.name}</strong><br>
        ${point.description ? `${point.description}<br>` : ''}
        <small>ID: ${point.id}</small>
      `;
      
      createMarker(map, point.latitude, point.longitude, 'disposal', popupContent);
    });

  } catch (error) {
    console.error('Error loading disposal point markers:', error);
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
