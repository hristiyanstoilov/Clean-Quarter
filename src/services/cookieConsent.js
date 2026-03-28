/**
 * Cookie Consent Service
 *
 * Shows a GDPR-compliant consent banner on first visit.
 * Stores choice in localStorage under 'cookieConsent' ('accepted' | 'rejected').
 * Must be called after i18n is initialized.
 */
import { t } from "../utils/i18n.js";

const STORAGE_KEY = "cookieConsent";

export function getCookieConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function hasGivenCookieConsent() {
  return getCookieConsent() !== null;
}

function setConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

function removeBanner(banner) {
  banner.classList.add("cookie-banner--hiding");
  setTimeout(() => banner.remove(), 300);
}

export function initCookieConsent() {
  if (hasGivenCookieConsent()) return;

  const banner = document.createElement("div");
  banner.id = "cookieConsentBanner";
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <div class="cookie-banner__content">
      <p class="cookie-banner__text">
        ${t("cookie.message")}
        <a href="/privacy" class="cookie-banner__link">${t("cookie.learnMore")}</a>
      </p>
      <div class="cookie-banner__actions">
        <button id="cookieAcceptBtn" class="cookie-banner__btn cookie-banner__btn--accept">${t("cookie.accept")}</button>
        <button id="cookieRejectBtn" class="cookie-banner__btn cookie-banner__btn--reject">${t("cookie.reject")}</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("cookieAcceptBtn").addEventListener("click", () => {
    setConsent("accepted");
    removeBanner(banner);
  });

  document.getElementById("cookieRejectBtn").addEventListener("click", () => {
    setConsent("rejected");
    removeBanner(banner);
  });
}
