const DICEBEAR_BASE = "https://api.dicebear.com/7.x";

const STYLE_BY_POINTS = [
  { minPoints: 100, style: "notionists" },
  { minPoints: 50, style: "adventurer" },
  { minPoints: 0, style: "bottts-neutral" },
];

/**
 * Generate a DiceBear avatar URL for a given user ID and points balance.
 * The style changes based on the user's rank tier.
 * @param {string} userId
 * @param {number} points
 * @returns {string} SVG avatar URL
 */
export function getDiceBearUrl(userId, points = 0) {
  const tier = STYLE_BY_POINTS.find((t) => points >= t.minPoints);
  const style = tier?.style || "bottts-neutral";
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(userId)}`;
}

/**
 * Resolve the avatar URL for a profile.
 * If the profile has an uploaded avatar_url → use it.
 * Otherwise → generate a DiceBear avatar based on user ID and points.
 * @param {Object|null} profile
 * @returns {string|null}
 */
export function getAvatarUrl(profile) {
  if (!profile) return null;
  if (profile.avatar_url) return profile.avatar_url;
  const id = profile.id || "default";
  const points = profile.points_balance || 0;
  return getDiceBearUrl(id, points);
}
