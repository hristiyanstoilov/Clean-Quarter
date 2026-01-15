import supabase from './supabase.js';

// Studentski Grad center coordinates
const STUDENTSKI_GRAD_CENTER = {
  lat: 42.6977,
  lng: 23.3219
};

/**
 * Initialize the map centered on Studentski Grad
 * @returns {Object} Leaflet map instance
 */
export function initializeMap() {
  const map = L.map('map').setView([STUDENTSKI_GRAD_CENTER.lat, STUDENTSKI_GRAD_CENTER.lng], 13);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Fetch active campaigns and display them as RED markers
 * @param {Object} map - Leaflet map instance
 */
export async function loadCampaignMarkers(map) {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, title, location_lat, location_lng, status')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }

    campaigns.forEach((campaign) => {
      const marker = L.marker([campaign.location_lat, campaign.location_lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);

      // Add popup with campaign info
      marker.bindPopup(`
        <strong>${campaign.title}</strong><br>
        Status: ${campaign.status}<br>
        <small>Campaign ID: ${campaign.id}</small>
      `);
    });

    console.log(`Loaded ${campaigns.length} active campaigns`);
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
    const { data: disposalPoints, error } = await supabase
      .from('disposal_points')
      .select('id, name, description, latitude, longitude');

    if (error) {
      console.error('Error fetching disposal points:', error);
      return;
    }

    disposalPoints.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);

      // Add popup with disposal point info
      marker.bindPopup(`
        <strong>${point.name}</strong><br>
        ${point.description ? `${point.description}<br>` : ''}
        <small>ID: ${point.id}</small>
      `);
    });

    console.log(`Loaded ${disposalPoints.length} disposal points`);
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
