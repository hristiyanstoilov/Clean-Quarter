// points.js
// Бизнес логика за изчисляване на точки

/** Points awarded for an approved cleanup participation */
export const CLEANUP_POINTS = 20;

export function calculatePoints(current, amount, type) {
  if (type === "earn") return current + amount;
  if (type === "spend") return current - amount;
  return current;
}
