import logger from "../services/logger.js";
// Named export for testability
export function getLanguage() {
  return getCurrentLanguage();
}
/**
 * Internationalization (i18n) Module
 * Handles language switching and translations
 */

let currentLanguage = null;
let translations = {};
let enableRealTimeSwitch = true; // Set to false to disable real-time switching
let translationsLoaded = false; // Guard against redundant fetches

/**
 * Initialize i18n - load language files.
 * Idempotent: re-fetch is skipped if translations were already loaded successfully.
 * Pass force=true to reload regardless.
 */
export async function initI18n(realTime = true, force = false) {
  enableRealTimeSwitch = realTime;
  if (translationsLoaded && !force) return; // already loaded — skip re-fetch
  try {
    // Load both translation files in parallel
    const [bgData, enData] = await Promise.all([
      fetch("/i18n/bg.json").then((r) => r.json()),
      fetch("/i18n/en.json").then((r) => r.json()),
    ]);

    translations = {
      bg: bgData,
      en: enData,
    };
    translationsLoaded = true;

    // Lazy-load language from localStorage if not set
    if (!currentLanguage) {
      try {
        currentLanguage =
          (typeof localStorage !== "undefined" && localStorage.getItem("CLEAN_QUARTER_LANGUAGE")) ||
          "bg";
      } catch {
        currentLanguage = "bg";
      }
    }

    logger.info(
      "✅ i18n initialized with",
      Object.keys(translations),
      "languages (realTime:",
      realTime,
      ")"
    );
    // Don't apply language here - let caller decide
  } catch (error) {
    logger.error("❌ Failed to load translations:", error);
    // translations stays {} — callers must handle keys being returned as-is
  }
}

/** Returns true if translations were loaded successfully. */
export function isI18nLoaded() {
  return translationsLoaded;
}

/**
 * Get translated text by key
 * @param {string} key - dot-separated key (e.g., 'nav.dashboard')
 * @param {object|string} paramsOrLang - interpolation params object (e.g., {username: 'John'}) or language code
 * @returns {string} translated text or key if not found
 */
export function t(key, paramsOrLang) {
  // Determine if second param is lang code (string) or interpolation params (object)
  const isParamsObject = paramsOrLang && typeof paramsOrLang === "object";
  const language = isParamsObject ? getCurrentLanguage() : paramsOrLang || getCurrentLanguage();
  const params = isParamsObject ? paramsOrLang : null;

  const keys = key.split(".");
  let value = translations[language];
  for (const k of keys) {
    value = value?.[k];
  }

  // If translation found and params provided, replace placeholders
  if (value && params) {
    Object.keys(params).forEach((paramKey) => {
      value = value.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), params[paramKey]);
    });
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
    return;
  }
  if (!translations[lang]) {
    logger.error("❌ Language not supported:", lang);
    return;
  }
  currentLanguage = lang;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("CLEAN_QUARTER_LANGUAGE", lang);
    }
  } catch {}
  logger.info("🌍 Language changed to:", lang);
  applyLanguage(lang);
}

/**
 * Get current language
 * @returns {string} current language code
 */
export function getCurrentLanguage() {
  if (!currentLanguage) {
    try {
      currentLanguage =
        (typeof localStorage !== "undefined" && localStorage.getItem("CLEAN_QUARTER_LANGUAGE")) ||
        "bg";
    } catch {
      currentLanguage = "bg";
    }
  }
  return currentLanguage;
}

/**
 * Apply language to page elements
 * Updates all elements with data-i18n attribute
 */
export function applyLanguage(lang) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;

    // Update all elements with data-i18n attribute (for text content)
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translated = t(key, lang);
      // Only overwrite if a real translation was found (not the raw key fallback).
      // This preserves the HTML default text when translations haven't loaded yet.
      if (translated === key) return;
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
      if (translated !== key) element.setAttribute("placeholder", translated);
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
