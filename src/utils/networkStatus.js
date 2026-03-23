/**
 * Network status banner — shows offline/online state to the user.
 * Disables action buttons while offline to prevent failed submissions.
 */

const ACTION_SELECTORS = "button[type=submit], .btn-primary, .btn-success, .btn-danger";

const MESSAGES = {
  offline: {
    bg: "⚠️ Няма интернет връзка. Някои функции са недостъпни.",
    en: "⚠️ No internet connection. Some features are unavailable.",
  },
  online: {
    bg: "✅ Връзката е възстановена.",
    en: "✅ Connection restored.",
  },
};

function getLang() {
  return localStorage.getItem("CLEAN_QUARTER_LANGUAGE") || "bg";
}

function setButtonsDisabled(disabled) {
  document.querySelectorAll(ACTION_SELECTORS).forEach((el) => {
    el.disabled = disabled;
  });
}

function showOffline(banner) {
  const lang = getLang();
  banner.textContent = MESSAGES.offline[lang] || MESSAGES.offline.bg;
  banner.className = "network-banner network-banner--offline";
  banner.style.display = "block";
  setButtonsDisabled(true);
}

function showOnline(banner) {
  const lang = getLang();
  banner.textContent = MESSAGES.online[lang] || MESSAGES.online.bg;
  banner.className = "network-banner network-banner--online";
  banner.style.display = "block";
  setButtonsDisabled(false);
  setTimeout(() => {
    banner.style.display = "none";
  }, 3000);
}

export function initNetworkStatusBanner() {
  const banner = document.getElementById("networkStatusBanner");
  if (!banner) return;

  window.addEventListener("offline", () => showOffline(banner));
  window.addEventListener("online", () => showOnline(banner));

  // Set initial state — no flash if already online
  if (!navigator.onLine) showOffline(banner);
}
