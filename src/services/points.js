// points.js
// Бизнес логика за изчисляване на точки

export function calculatePoints(current, amount, type) {
  if (type === "earn") return current + amount;
  if (type === "spend") return current - amount;
  return current;
}
