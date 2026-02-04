// Utility functions for environment/browser checks

/**
 * Returns true if running in browser (window defined)
 */
export function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Returns true if localStorage is available
 */
export function hasLocalStorage() {
  try {
    return isBrowser() && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Returns true if navigator is available
 */
export function hasNavigator() {
  return typeof navigator !== "undefined";
}
