/**
 * Points calculation utilities
 */

export const POINTS_CONFIG = {
  CAMPAIGN_COMPLETION: 50,
  PARTICIPATION: 25,
  BONUS_MULTIPLIER: 1.5,
};

export function calculatePointsEarned(participation) {
  let points = POINTS_CONFIG.PARTICIPATION;

  if (participation.status === "approved") {
    points = POINTS_CONFIG.CAMPAIGN_COMPLETION;
  }

  // Weekend bonus
  const dayOfWeek = new Date(participation.created_at).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    points *= POINTS_CONFIG.BONUS_MULTIPLIER;
  }

  return Math.round(points);
}
