import logger from "./logger.js";
import { isBrowser, hasLocalStorage, hasNavigator } from "../utils/env.js";
import { t } from "../utils/i18n.js";
/**
 * PWA Service - Handles Progressive Web App functionality
 */

/**
 * Initialize PWA
 * - Register service worker
 * - Request notification permission
 * - Handle install prompts
 */
export async function initializePWA() {
  // Register Service Worker
  if (hasNavigator() && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      logger.info("✅ Service Worker registered:", registration);
    } catch (error) {
      logger.warn("❌ Service Worker registration failed:", error);
    }
  }

  // Push notification permission is requested only via the explicit toggle
  // in profile.js — never automatically on page load (browsers block it without user gesture)

  // Handle install prompt
  let deferredPrompt;
  if (isBrowser()) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPrompt(deferredPrompt);
    });

    window.addEventListener("appinstalled", () => {
      logger.info("✅ App installed");
      if (hasLocalStorage()) {
        localStorage.setItem("pwaInstalled", "true");
      }
    });
  }
}

/**
 * Show install prompt to user
 */
function showInstallPrompt(deferredPrompt) {
  // Only show if not already installed
  if (hasLocalStorage() && localStorage.getItem("pwaInstalled")) {
    return;
  }

  // Show install banner after 3 seconds
  setTimeout(() => {
    const banner = createInstallBanner();
    if (isBrowser()) {
      document.body.appendChild(banner);
    }

    banner.querySelector(".install-btn").addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        logger.info("User response:", outcome);
        deferredPrompt = null;
        banner.remove();
      }
    });

    banner.querySelector(".close-btn").addEventListener("click", () => {
      banner.remove();
    });
  }, 3000);
}

/**
 * Create install banner element
 */
function createInstallBanner() {
  const banner = document.createElement("div");
  // SAFE: Only static HTML, no user content injected
  banner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(40,167,69,0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 999;
            gap: 1rem;
            flex-wrap: wrap;
        ">
            <div style="flex: 1; min-width: 200px;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">📱 ${t("pwa.installTitle")}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">${t("pwa.installBody")}</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="install-btn" style="
                    background: white;
                    color: #28a745;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.875rem;
                ">
                    ✓ ${t("pwa.installBtn")}
                </button>
                <button class="close-btn" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.875rem;
                ">
                    ✕ ${t("pwa.laterBtn")}
                </button>
            </div>
        </div>
    `;
  return banner;
}

/**
 * Send notification to user
 */
export function sendNotification(title, options = {}) {
  if (isBrowser() && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      icon: "/images/icon-192x192.png",
      badge: "/images/icon-192x192.png",
      ...options,
    });
  }
}

/**
 * Check if app is online
 */
export function isOnline() {
  return hasNavigator() && navigator.onLine;
}

/**
 * Check if running as PWA
 */
export function isInstalledPWA() {
  return (
    (isBrowser() && window.matchMedia("(display-mode: standalone)").matches) ||
    (hasNavigator() && window.navigator.standalone === true) ||
    (isBrowser() && document.referrer.includes("android-app://"))
  );
}

/**
 * Cache data for offline use
 */
export async function cacheData(key, data) {
  try {
    const cache = await caches.open("clean-quarter-data-v1");
    const response = new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(key, response);
  } catch (error) {
    logger.warn("Error caching data:", error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData(key) {
  try {
    const cache = await caches.open("clean-quarter-data-v1");
    const response = await cache.match(key);
    if (response) {
      return await response.json();
    }
  } catch (error) {
    logger.warn("Error getting cached data:", error);
  }
  return null;
}
/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (hasNavigator() && navigator.serviceWorker && navigator.serviceWorker.register) {
    await navigator.serviceWorker.register("/service-worker.js");
    return "ok";
  }
  return false;
}
