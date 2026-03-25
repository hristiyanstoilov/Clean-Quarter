import { setupGlobalErrorHandling } from "../services/errorHandler.js";
import { initializePWA } from "../services/pwa.js";

/**
 * Must be called once at the start of every page's DOMContentLoaded handler.
 * - Registers the service worker (PWA offline support + install prompt)
 * - Attaches global unhandledrejection / error listeners so nothing is swallowed silently
 */
export function initPage() {
  setupGlobalErrorHandling();
  initializePWA(); // async, fire-and-forget — SW registration does not block UI
}
