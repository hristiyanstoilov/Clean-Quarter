import logger from "../services/logger.js";
import { isBrowser, hasLocalStorage, hasNavigator } from "./env.js";

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe string
 */
export function escapeHTML(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
/**
 * Generate a random string of given length
 * @param {number} length
 * @returns {string}
 */
export function randomString(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
/**
 * Capitalize first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Utility functions for common operations across the application
 * Reduces code duplication and improves maintainability
 */

/**
 * Get current user from local storage
 * @returns {Object|null} Current user object or null
 */
export function getCurrentUser() {
  try {
    if (hasLocalStorage()) {
      const userJSON = localStorage.getItem("user");
      return userJSON ? JSON.parse(userJSON) : null;
    }
    return null;
  } catch (error) {
    logger.error("Error parsing stored user:", error);
    return null;
  }
}

/**
 * Save user to local storage (only non-sensitive fields)
 * @param {Object} user - User object to save
 *
 * SECURITY: Only non-sensitive user data is stored. Never store tokens or secrets in localStorage.
 */
export function saveUser(user) {
  try {
    if (hasLocalStorage()) {
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.username,
        role: user.role || user.user_metadata?.role,
        neighborhood: user.user_metadata?.neighborhood || user.neighborhood,
      };
      localStorage.setItem("user", JSON.stringify(safeUser));
    }
  } catch (error) {
    logger.error("Error saving user:", error);
  }
}

/**
 * Remove user from local storage (logout)
 */
export function removeUser() {
  try {
    if (hasLocalStorage()) {
      localStorage.removeItem("user");
    }
  } catch (error) {
    logger.error("Error removing user:", error);
  }
}

/**
 * Check if user is authenticated, redirect if not
 * @param {string} redirectUrl - URL to redirect to if not authenticated (must be relative)
 * @returns {boolean} True if user exists, false otherwise
 */
export function requireAuth(redirectUrl = "/") {
  const user = getCurrentUser();
  if (!user) {
    if (isBrowser()) {
      // Prevent open redirect - only allow relative URLs
      const safeUrl =
        redirectUrl && !redirectUrl.includes("://") && !redirectUrl.startsWith("//")
          ? redirectUrl
          : "/";
      window.location.href = safeUrl;
    }
    return false;
  }
  return true;
}

/**
 * Show SweetAlert2 success notification
 * @param {string} title - Title of the alert
 * @param {string} text - Message text
 * @param {number} timer - Auto-close timer in ms (optional)
 */
export async function showSuccess(title, text, timer = null) {
  const config = {
    icon: "success",
    title,
    text,
    confirmButtonColor: "#28a745",
  };

  if (timer) {
    config.timer = timer;
    config.timerProgressBar = true;
  }

  if (typeof Swal !== "undefined" && Swal?.fire) {
    return Swal.fire(config);
  }
  return Promise.resolve();
}

/**
 * Show SweetAlert2 error notification
 * @param {string} title - Title of the alert
 * @param {string} text - Message text or error object
 * @param {number} timer - Auto-close timer in ms (optional)
 */
export async function showError(title, text, timer = null) {
  const errorText = text instanceof Error ? text.message : text;
  if (typeof Swal === "undefined" || !Swal?.fire) {
    window.alert(`${title}\n${errorText}`);
    return Promise.resolve();
  }
  const config = {
    icon: "error",
    title,
    text: errorText,
    confirmButtonColor: "#dc3545",
  };

  if (timer) {
    config.timer = timer;
    config.timerProgressBar = true;
  }

  return Swal.fire(config);
}

/**
 * Show SweetAlert2 info notification
 * @param {string} title - Title of the alert
 * @param {string} text - Message text
 */
export async function showInfo(title, text) {
  if (typeof Swal === "undefined" || !Swal?.fire) {
    window.alert(`${title}\n${text}`);
    return Promise.resolve();
  }
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonColor: "#17a2b8",
  });
}

/**
 * Show a non-blocking SweetAlert2 toast notification (top-end corner).
 * Use for success/info confirmations that don't require user interaction.
 * @param {'success'|'info'|'warning'} icon
 * @param {string} title - Message shown in toast
 * @param {number} timer - Auto-close ms (default 2500)
 */
export async function showToast(icon, title, timer = 2500) {
  if (typeof Swal === "undefined" || !Swal?.fire) return Promise.resolve();
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
  });
}

/** Convenience: success toast */
export async function showSuccessToast(title, timer = 2500) {
  return showToast("success", title, timer);
}

/** Convenience: info toast */
export async function showInfoToast(title, timer = 2500) {
  return showToast("info", title, timer);
}

/**
 * Show SweetAlert2 warning notification with confirmation
 * @param {string} title - Title of the alert
 * @param {string} text - Message text
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export async function showConfirm(title, text, confirmText = "Yes", cancelText = "Cancel") {
  if (typeof Swal === "undefined" || !Swal?.fire) {
    return window.confirm(`${title}\n${text}`);
  }
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
}

/**
 * Install a minimal Swal polyfill using native browser dialogs.
 * No-op if window.Swal already exists (CDN loaded successfully).
 * Call this at the start of any script that uses Swal.fire() directly.
 */
export function initSwalFallback() {
  if (typeof window === "undefined" || window.Swal) return;
  window.Swal = {
    fire(opts = {}) {
      // Loading dialogs (showLoading) — resolve immediately, no UI needed
      if (typeof opts.didOpen === "function") return Promise.resolve({});
      if (opts.showCancelButton) {
        const msg = [opts.title, opts.text].filter(Boolean).join("\n");
        return Promise.resolve({ isConfirmed: window.confirm(msg), isDismissed: false });
      }
      const msg = [opts.title, opts.text].filter(Boolean).join("\n");
      window.alert(msg);
      return Promise.resolve({ isConfirmed: true, isDismissed: false });
    },
    showLoading() {},
    close() {},
    isVisible() {
      return false;
    },
  };
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time' (default: 'short')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = "short") {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    const options = {
      short: { year: "numeric", month: "short", day: "numeric" },
      long: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
      time: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
    };
    return dateObj.toLocaleDateString("en-US", options[format] || options.short);
  } catch (error) {
    logger.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format time difference (e.g., "2 days ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Human-readable time difference
 */
export function getTimeAgo(date) {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateObj, "short");
  } catch (error) {
    logger.error("Error calculating time ago:", error);
    return "Unknown";
  }
}

/**
 * Toggle visibility of HTML elements
 * @param {string} elementId - ID of element to toggle
 * @param {string} display - Display value ('flex', 'block', 'none')
 */
export function toggleElement(elementId, display = "flex") {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = element.style.display === "none" ? display : "none";
  }
}

/**
 * Show loading spinner and hide other elements
 * @param {string} spinnerId - ID of spinner element
 * @param {string[]} hideElementIds - IDs of elements to hide
 */
export function showLoading(spinnerId, hideElementIds = []) {
  const spinner = document.getElementById(spinnerId);
  if (spinner) {
    spinner.style.display = "flex";
  }

  hideElementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = "none";
    }
  });
}

/**
 * Hide loading spinner and show other elements
 * @param {string} spinnerId - ID of spinner element
 * @param {Object} elementsToShow - Object with id as key and display value
 */
export function hideLoading(spinnerId, elementsToShow = {}) {
  const spinner = document.getElementById(spinnerId);
  if (spinner) {
    spinner.style.display = "none";
  }

  Object.entries(elementsToShow).forEach(([id, display]) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = display || "block";
    }
  });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if array or object is empty
 * @param {any} data - Data to check
 * @returns {boolean} True if empty
 */
export function isEmpty(data) {
  if (!data) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data).length === 0;
  if (typeof data === "string") return data.trim().length === 0;
  return false;
}

/**
 * Safe JSON stringify with error handling
 * @param {any} data - Data to stringify
 * @returns {string} JSON string or empty object
 */
export function safeStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    logger.error("Error stringifying data:", error);
    return "{}";
  }
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parse fails
 * @returns {any} Parsed object or fallback
 */
export function safeParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error("Error parsing JSON:", error);
    if (fallback && typeof fallback === "object" && "fallback" in fallback) {
      return fallback.fallback;
    }
    return fallback;
  }
}

/**
 * Debounce function to limit function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Handle error with logging and user notification
 * @param {string} context - Context/location of error
 * @param {Error} error - Error object
 * @param {string} userMessage - Message to show user
 */
export async function handleError(
  context,
  error,
  userMessage = "An error occurred. Please try again."
) {
  logger.error(`[${context}]`, error);
  await showError("Error", userMessage);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    if (hasNavigator() && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    logger.error("Error copying to clipboard:", error);
    return false;
  }
}

/**
 * Get URL query parameter
 * @param {string} paramName - Parameter name
 * @returns {string|null} Parameter value or null
 */
export function getQueryParam(paramName) {
  if (isBrowser()) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  }
  return null;
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} URL with query string
 */
export function buildUrl(baseUrl, params = {}) {
  let origin = "";
  if (isBrowser() && window.location && window.location.origin) {
    origin = window.location.origin;
  } else {
    origin = "http://localhost";
  }
  const url = new URL(baseUrl, origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

/**
 * Check if string is valid UUID
 * @param {string} uuid - String to check
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Truncate text to max length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format currency/points value
 * @param {number} value - Value to format
 * @param {string} symbol - Currency symbol (default: ⭐)
 * @returns {string} Formatted value
 */
export function formatValue(value, symbol = "⭐") {
  // Always use en-US for thousands separator for test consistency
  return `${value.toLocaleString("en-US")} ${symbol}`;
}
