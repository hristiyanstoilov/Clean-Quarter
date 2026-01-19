/**
 * Architecture - Centralized Exports
 * Single entry point for all architectural components
 */

// State Management
export { default as store } from '../state/store.js';

// API
export { default as apiClient } from '../api/client.js';

// Validation
export {
  validateField,
  validateForm,
  validateWithSchema,
  addRule,
  addSchema,
  getErrorMessage,
  rules,
  schemas
} from '../services/validation.js';

// Hooks (Composition)
export {
  useAsync,
  useFetch,
  useForm,
  useState,
  useStoreState,
  useEffect,
  useDebounce,
  useThrottle
} from '../hooks/index.js';

// Logger
export { default as logger } from '../services/logger.js';

// Error Handler
export {
  default as errorHandler,
  AppError,
  ERROR_TYPES,
  setupGlobalErrorHandling
} from '../services/errorHandler.js';

/**
 * Initialize Architecture
 * Call this in your main.js to setup everything
 */
export async function initializeArchitecture() {
  console.log('🏗️ Initializing Clean Architecture...');

  // 1. Setup global error handling
  setupGlobalErrorHandling();

  // 2. Setup logger
  logger.setLevel(import.meta.env.DEV ? 'debug' : 'info');

  // 3. Setup store subscribers (optional)
  store.subscribe((newState) => {
    logger.debug('Store updated', newState);
  });

  // 4. Setup API interceptors
  apiClient.useRequestInterceptor(async (config) => {
    logger.debug('API Request', { method: config.method, url: config.url });
    return config;
  });

  apiClient.useResponseInterceptor(async (response) => {
    logger.debug('API Response', { status: response.status, url: response.url });
    return response;
  });

  logger.info('✅ Architecture initialized');

  return {
    store,
    apiClient,
    errorHandler,
    logger
  };
}

/**
 * Quick Setup Utilities
 */

// Quick notification
export function notify(message, type = 'info', duration = 3000) {
  return store.notify(message, type, duration);
}

// Quick error
export function error(message, context = 'unknown') {
  return store.addError(message, context);
}

// Quick fetch
export async function fetchData(url, options = {}) {
  try {
    return await apiClient.get(url, options);
  } catch (err) {
    errorHandler.handle(err);
    throw err;
  }
}

// Quick post
export async function postData(url, data, options = {}) {
  try {
    return await apiClient.post(url, data, options);
  } catch (err) {
    errorHandler.handle(err);
    throw err;
  }
}
