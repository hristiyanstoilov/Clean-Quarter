/**
 * Internationalization (i18n) Module
 * Handles language switching and translations
 */

let currentLanguage = null;
let translations = {};
let enableRealTimeSwitch = true; // Set to false to disable real-time switching

/**
 * Initialize i18n - load language files
 */
export async function initI18n(realTime = true) {
  enableRealTimeSwitch = realTime;
  try {
    // Load Bulgarian translations
    const bgResponse = await fetch("/src/i18n/bg.json");
    const bgData = await bgResponse.json();

    // Load English translations
    const enResponse = await fetch("/src/i18n/en.json");
    const enData = await enResponse.json();

    translations = {
      bg: bgData,
      en: enData,
    };

    // Lazy-load language from localStorage if not set
    if (!currentLanguage) {
      try {
        currentLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem("CLEAN_QUARTER_LANGUAGE")) || "bg";
      } catch { currentLanguage = "bg"; }
    }

    console.log(
      "✅ i18n initialized with",
      Object.keys(translations),
      "languages (realTime:",
      realTime,
      ")"
    );
    // Don't apply language here - let caller decide
  } catch (error) {
    console.error("❌ Failed to load translations:", error);
  }
}

/**
 * Get translated text by key
 * @param {string} key - dot-separated key (e.g., 'nav.dashboard')
 * @param {string} lang - language code (optional, uses current language)
 * @returns {string} translated text or key if not found
 */
export function t(key, lang) {
  const language = lang || getCurrentLanguage();
  const keys = key.split(".");
  let value = translations[language];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}


/**
 * Set current language and apply it
 * @param {string} lang - 'bg' or 'en'
 * @param {boolean} force - force update even if realTime is disabled
 */
export function setLanguage(lang, force = false) {
  if (!enableRealTimeSwitch && !force) {
    console.warn("⚠️ Real-time language switching is disabled on this page");
    return;
  }
  if (!translations[lang]) {
    console.error("❌ Language not supported:", lang);
    return;
  }
  currentLanguage = lang;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("CLEAN_QUARTER_LANGUAGE", lang);
    }
  } catch {}
  console.log("🌍 Language changed to:", lang);
  applyLanguage(lang);
}


/**
 * Get current language
 * @returns {string} current language code
 */
export function getCurrentLanguage() {
  if (!currentLanguage) {
    try {
      currentLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem("CLEAN_QUARTER_LANGUAGE")) || "bg";
    } catch { currentLanguage = "bg"; }
  }
  return currentLanguage;
}

/**
 * Apply language to page elements
 * Updates all elements with data-i18n attribute
 */
export function applyLanguage(lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;

  // Update all elements with data-i18n attribute (for text content)
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translated = t(key, lang);
      if (element.hasAttribute("title")) {
        element.setAttribute("title", translated);
      } else {
        element.textContent = translated;
      }
    });
    // Update all elements with data-i18n-placeholder attribute (for placeholders)
    const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");
    placeholderElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const translated = t(key, lang);
      element.setAttribute("placeholder", translated);
    });
    // Update language selector
    const langSelector = document.getElementById("languageSelector");
    if (langSelector) {
      langSelector.value = lang;
    }
    // Dispatch custom event for other parts of app
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));
  }
}

/**
 * Get all available languages
 * @returns {array} array of language codes
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}
