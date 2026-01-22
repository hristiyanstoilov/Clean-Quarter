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
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/public/service-worker.js");
      console.log("✅ Service Worker registered:", registration);
    } catch (error) {
      console.warn("❌ Service Worker registration failed:", error);
    }
  }

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Handle install prompt
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt(deferredPrompt);
  });

  window.addEventListener("appinstalled", () => {
    console.log("✅ App installed");
    localStorage.setItem("pwaInstalled", "true");
  });
}

/**
 * Show install prompt to user
 */
function showInstallPrompt(deferredPrompt) {
  // Only show if not already installed
  if (localStorage.getItem("pwaInstalled")) {
    return;
  }

  // Show install banner after 3 seconds
  setTimeout(() => {
    const banner = createInstallBanner();
    document.body.appendChild(banner);

    banner.querySelector(".install-btn").addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("User response:", outcome);
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
                <div style="font-weight: bold; margin-bottom: 0.25rem;">📱 Install App</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Get instant access to Clean Quarter</div>
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
                    ✓ Install
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
                    ✕ Later
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
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      icon: "/public/icon-192x192.png",
      badge: "/public/icon-192x192.png",
      ...options,
    });
  }
}

/**
 * Check if app is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Check if running as PWA
 */
export function isInstalledPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
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
    console.warn("Error caching data:", error);
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
    console.warn("Error getting cached data:", error);
  }
  return null;
}
