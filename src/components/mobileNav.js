import { getI18n } from "../utils/i18n.js";

// Logger reference (loaded lazily)
let logger = null;

/**
 * Get logger instance, loading it if needed
 */
function getLogger() {
  if (!logger) {
    // Create a safe fallback
    logger = {
      debug: () => {},
      error: () => {},
    };
  }
  return logger;
}

/**
 * Load the real logger from services
 */
async function loadLogger() {
  try {
    const loggerModule = await import("../services/logger.js");
    if (loggerModule.logger) {
      logger = loggerModule.logger;
    }
  } catch {
    // Logger unavailable, use fallback
  }
}

// Attempt to load logger on module load
loadLogger().catch(() => {});

// Guard against duplicate initialization
let isMobileNavInitialized = false;

/**
 * Get the current active page based on URL
 * Supports pathname matching and URL fragments
 */
function getActivePage() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // Extract filename without extension
  const filename = path.split("/").pop().replace(".html", "") || "dashboard";

  // Map filenames to nav item keys
  const pageMap = {
    dashboard: "dashboard",
    index: "dashboard",
    "": "dashboard",
    "create-campaign": "createCampaign",
    rewards: "rewards",
    profile: "profile",
  };

  // Support URL fragments (e.g., dashboard.html#rewards)
  if (hash) {
    const hashPage = hash.replace("#", "").toLowerCase();
    if (pageMap[hashPage]) return pageMap[hashPage];
  }

  return pageMap[filename] || "dashboard";
}

/**
 * Create the mobile navigation HTML structure
 */
function createMobileNav() {
  const i18n = getI18n();

  const navItems = [
    { id: "nav-home", key: "dashboard", href: "./dashboard.html", icon: "🏠" },
    { id: "nav-create", key: "createCampaign", href: "./create-campaign.html", icon: "➕" },
    { id: "nav-rewards", key: "rewards", href: "./rewards.html", icon: "🎁" },
    { id: "nav-profile", key: "profile", href: "./profile.html", icon: "👤" },
  ];

  const activePage = getActivePage();

  const navHTML = `
    <nav id="mobile-nav" class="mobile-nav" role="navigation" aria-label="Mobile Navigation">
      <div class="mobile-nav-container">
        ${navItems
          .map((item) => {
            const isActive = activePage === item.key;
            const label = i18n.nav[item.key];
            return `
            <a 
              href="${item.href}" 
              class="mobile-nav-item ${isActive ? "active" : ""}" 
              data-page="${item.key}"
              aria-current="${isActive ? "page" : "false"}"
              title="${label}"
            >
              <span class="mobile-nav-icon">${item.icon}</span>
              <span class="mobile-nav-label">${label}</span>
            </a>
          `;
          })
          .join("")}
      </div>
    </nav>
  `;

  return navHTML;
}

/**
 * Initialize mobile navigation
 * - Inject nav into DOM
 * - Attach event listeners
 * - Handle active state on page changes
 */
function initMobileNav() {
  // Guard against duplicate initialization
  if (isMobileNavInitialized) {
    getLogger().debug("[MobileNav] Already initialized, skipping");
    return;
  }

  try {
    // Check if nav already exists
    if (document.getElementById("mobile-nav")) {
      getLogger().debug("[MobileNav] Mobile nav element already exists");
      isMobileNavInitialized = true;
      return;
    }

    // Create and inject nav
    const navHTML = createMobileNav();
    document.body.insertAdjacentHTML("beforeend", navHTML);

    // Update active state on navigation
    const navItems = document.querySelectorAll(".mobile-nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");
      });
    });

    // Update active state on popstate (browser back/forward)
    window.addEventListener("popstate", () => {
      updateMobileNavActive();
    });

    // Listen for hashchange (for apps using URL fragments)
    window.addEventListener("hashchange", () => {
      updateMobileNavActive();
    });

    isMobileNavInitialized = true;
    getLogger().debug("[MobileNav] Mobile navigation initialized successfully");
  } catch (error) {
    getLogger().error("[MobileNav] Failed to initialize mobile navigation", error);
  }
}

/**
 * Update active state on mobile nav items
 */
function updateMobileNavActive() {
  const activePage = getActivePage();
  const navItems = document.querySelectorAll(".mobile-nav-item");

  navItems.forEach((item) => {
    const page = item.dataset.page;
    if (page === activePage) {
      item.classList.add("active");
      item.setAttribute("aria-current", "page");
    } else {
      item.classList.remove("active");
      item.setAttribute("aria-current", "false");
    }
  });
}

// Initialize on module load
initMobileNav();

export { initMobileNav, getActivePage, updateMobileNavActive };
