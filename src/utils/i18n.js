/**
 * Internationalization (i18n) Module
 * Handles language switching and translations
 */

let currentLanguage = localStorage.getItem('CLEAN_QUARTER_LANGUAGE') || 'bg';
let translations = {};

/**
 * Initialize i18n - load language files
 */
export async function initI18n() {
  try {
    // Load Bulgarian translations
    const bgResponse = await fetch('/src/i18n/bg.json');
    const bgData = await bgResponse.json();
    
    // Load English translations
    const enResponse = await fetch('/src/i18n/en.json');
    const enData = await enResponse.json();
    
    translations = {
      bg: bgData,
      en: enData
    };
    
    console.log('✅ i18n initialized with', Object.keys(translations), 'languages');
    
    // Apply current language
    applyLanguage(currentLanguage);
  } catch (error) {
    console.error('❌ Failed to load translations:', error);
  }
}

/**
 * Get translated text by key
 * @param {string} key - dot-separated key (e.g., 'nav.dashboard')
 * @param {string} lang - language code (optional, uses current language)
 * @returns {string} translated text or key if not found
 */
export function t(key, lang = currentLanguage) {
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

/**
 * Set current language and apply it
 * @param {string} lang - 'bg' or 'en'
 */
export function setLanguage(lang) {
  if (!translations[lang]) {
    console.error('❌ Language not supported:', lang);
    return;
  }
  
  currentLanguage = lang;
  localStorage.setItem('CLEAN_QUARTER_LANGUAGE', lang);
  
  console.log('🌍 Language changed to:', lang);
  
  applyLanguage(lang);
}

/**
 * Get current language
 * @returns {string} current language code
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Apply language to page elements
 * Updates all elements with data-i18n attribute
 */
export function applyLanguage(lang) {
  document.documentElement.lang = lang;
  
  // Update all elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translated = t(key, lang);
    
    // Check if it's a placeholder
    if (element.hasAttribute('placeholder')) {
      element.setAttribute('placeholder', translated);
    } 
    // Check if it's a title/alt
    else if (element.hasAttribute('title')) {
      element.setAttribute('title', translated);
    }
    // Otherwise it's text content
    else {
      element.textContent = translated;
    }
  });
  
  // Update language selector
  const langSelector = document.getElementById('languageSelector');
  if (langSelector) {
    langSelector.value = lang;
  }
  
  // Dispatch custom event for other parts of app
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Get all available languages
 * @returns {array} array of language codes
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}
