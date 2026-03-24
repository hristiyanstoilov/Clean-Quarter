/**
 * Canonical neighborhood keys — must match the values stored in the DB `neighborhood` column.
 * Single source of truth: import from here instead of defining locally.
 */
export const NEIGHBORHOODS = [
  "Studentski Grad",
  "Darvenitsa",
  "Musagenitsa",
  "Vitosha (VEC)",
  "Malinova Dolina",
];

/**
 * Geographic bounding box for the city of Sofia.
 * Campaigns must be placed within these bounds.
 * Must stay in sync with the DB CHECK constraint on campaigns.location_lat/lng.
 */
export const SOFIA_BOUNDS = {
  minLat: 42.55,
  maxLat: 42.8,
  minLng: 23.15,
  maxLng: 23.55,
};

/**
 * Returns true if the given coordinates fall within Sofia's bounding box.
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export function isWithinSofia(lat, lng) {
  return (
    lat >= SOFIA_BOUNDS.minLat &&
    lat <= SOFIA_BOUNDS.maxLat &&
    lng >= SOFIA_BOUNDS.minLng &&
    lng <= SOFIA_BOUNDS.maxLng
  );
}
