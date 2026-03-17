import { t } from "../utils/i18n.js";

/**
 * Create a reusable empty state component
 * @param {string} icon - Emoji or icon string (e.g., '🍃')
 * @param {string} titleKey - i18n key for title (e.g., 'emptyState.noCampaigns')
 * @param {string} messageKey - i18n key for message
 * @param {object} options - Optional { ctaText, ctaHref, ctaKey }
 * @returns {string} HTML string for empty state div
 */
export function createEmptyState(icon, titleKey, messageKey, options = {}) {
  const title = t(titleKey) || titleKey;
  const message = t(messageKey) || messageKey;

  let ctaHtml = "";
  if (options.ctaHref && options.ctaKey) {
    const ctaText = t(options.ctaKey) || options.ctaKey;
    ctaHtml = `<a href="${options.ctaHref}" class="btn btn-success mt-3" style="font-weight: 600;">${ctaText} →</a>`;
  }

  return `
    <div style="
      text-align: center;
      padding: 3rem 1rem;
      color: #6c757d;
    ">
      <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.8;">
        ${icon}
      </div>
      <h3 style="color: #212529; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">
        ${title}
      </h3>
      <p style="font-size: 1rem; margin-bottom: 1.5rem;">
        ${message}
      </p>
      ${ctaHtml}
    </div>
  `;
}

/**
 * Render empty state to a container
 * @param {string} containerId - HTML element ID
 * @param {string} icon - Emoji/icon
 * @param {string} titleKey - i18n key for title
 * @param {string} messageKey - i18n key for message
 * @param {object} options - Optional CTA options
 */
export function renderEmptyState(containerId, icon, titleKey, messageKey, options = {}) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = createEmptyState(icon, titleKey, messageKey, options);
  }
}

export default { createEmptyState, renderEmptyState };
