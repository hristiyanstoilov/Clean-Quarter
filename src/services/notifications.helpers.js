/**
 * Notification Helpers
 *
 * Pure utilities shared by notifications.js (bell) and notifications-page.js.
 * Exported for direct unit testing without DOM or Supabase dependencies.
 */

/**
 * Human-readable BG fallbacks used when i18n hasn't loaded yet.
 * Keyed by the i18n key stored in the notification's JSON message.
 */
export const NOTIFICATION_FALLBACK = {
  "notification.participationApproved": (d) =>
    d.points
      ? `Участието ти беше одобрено! Спечели ${d.points} точки.`
      : "Участието ти беше одобрено!",
  "notification.participationRejected": (d) =>
    d.reason
      ? `Участието ти беше отхвърлено. Причина: ${d.reason}`
      : "Участието ти беше отхвърлено.",
  "notification.campaignJoin": (d) =>
    `${d.username ?? ""} се присъедини към твоята кампания "${d.title ?? ""}".`,
  "notification.campaignCompleted": (d) => `Кампанията "${d.title ?? ""}" приключи!`,
  "notification.pointsEarned": (d) => (d.points ? `Спечели ${d.points} точки!` : "Спечели точки!"),
  "notification.newComment": (d) =>
    `${d.username ?? ""} коментира твоята кампания "${d.title ?? ""}".`,
  "notification.reportResolved": () => "Твоят сигнал беше прегледан и решен.",
};

/**
 * Normalize a notification message to a structured data object.
 *
 * Handles four input types that Supabase can produce:
 *   null / undefined  → null   (caller should treat as empty)
 *   JS object (JSONB) → object as-is
 *   JSON string       → parsed object
 *   plain-text string → null   (caller should treat as legacy message)
 *
 * @param {*} message
 * @returns {object|null}
 */
export function parseMessageData(message) {
  if (message === null || message === undefined) return null;
  if (typeof message === "object") return message;
  if (typeof message === "string") {
    try {
      return JSON.parse(message);
    } catch {
      return null; // plain-text legacy message
    }
  }
  return null;
}

// NOTE: DB always stores type="approval" for participation notifications (both
// approved and rejected). The "rejected" key is only reachable via explicit
// TYPE_ICON.rejected returns in iconForNotification, which inspects the i18n
// key in the message payload to detect rejection — never via TYPE_ICON[type].
export const TYPE_ICON = {
  approval: "✅",
  rejected: "❌",
  points: "⭐",
  campaign_update: "📢",
};

/**
 * Select the appropriate icon for a notification.
 * Handles structured JSONB messages (object or JSON string) and legacy plain-text.
 *
 * @param {string} type - Notification type from DB (e.g. "approval", "points")
 * @param {string|object|null} message - Raw notification message
 * @returns {string} Emoji icon
 */
export function iconForNotification(type, message) {
  const data = parseMessageData(message);
  if (data?.key === "notification.participationRejected") return TYPE_ICON.rejected;

  // Legacy plain-text fallback (pre-i18n messages stored as BG/EN text)
  if (type === "approval" && typeof message === "string" && message) {
    if (message.toLowerCase().includes("отхвърл")) return TYPE_ICON.rejected;
    if (message.toLowerCase().includes("rejected")) return TYPE_ICON.rejected;
  }
  return TYPE_ICON[type] || "🔔";
}
