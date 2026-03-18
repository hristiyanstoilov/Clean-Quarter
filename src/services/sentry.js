/**
 * Sentry Error Tracking
 * Initializes Sentry and exposes helpers for capturing exceptions and context.
 * Only active when VITE_SENTRY_DSN is set — safe to import in all environments.
 */

import * as Sentry from "@sentry/browser";

const DSN = import.meta.env.VITE_SENTRY_DSN;
const ENV = import.meta.env.MODE || "development";

let initialized = false;

/**
 * Initialize Sentry. Call once at app startup.
 * No-ops silently if DSN is missing (dev / test environments).
 */
export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    // Capture 100% of errors in production, 0% of performance traces (free tier)
    tracesSampleRate: 0,
    // Ignore known non-actionable browser errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^Network Error$/,
      /^Load failed$/,
    ],
    beforeSend(event) {
      // Strip auth tokens from request headers if accidentally captured
      if (event.request?.headers?.Authorization) {
        delete event.request.headers.Authorization;
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Attach user identity to future Sentry events.
 * Call after successful login. Pass null to clear on logout.
 * @param {{ id: string, email?: string, neighborhood?: string } | null} user
 */
export function setSentryUser(user) {
  if (!initialized) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, neighborhood: user.neighborhood });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture an exception in Sentry with optional extra context.
 * Safe to call even when Sentry is not initialized.
 * @param {Error|unknown} error
 * @param {Record<string, unknown>} [extras]
 */
export function captureError(error, extras = {}) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    Object.entries(extras).forEach(([key, value]) => scope.setExtra(key, value));
    Sentry.captureException(error);
  });
}
