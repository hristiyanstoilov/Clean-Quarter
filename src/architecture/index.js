/**
 * Architecture - Centralized Exports
 * Single entry point for all architectural components
 */

// State Management
import storeInstance from '../state/store.js';
export { default as store } from '../state/store.js';

// API
import apiClientInstance from '../api/client.js';
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
import loggerInstance from '../services/logger.js';
export { default as logger } from '../services/logger.js';

// Error Handler - import for local use AND re-export
import errorHandlerInstance, { 
  AppError as AppErrorClass, 
  ERROR_TYPES as ErrorTypesEnum,
  setupGlobalErrorHandling as setupErrorHandling
} from '../services/errorHandler.js';

export const errorHandler = errorHandlerInstance;
export const AppError = AppErrorClass;
export const ERROR_TYPES = ErrorTypesEnum;
export const setupGlobalErrorHandling = setupErrorHandling;

/**
 * Initialize Architecture
 * Call this in your main.js to setup everything
 */
export async function initializeArchitecture() {
  console.log('🏗️ Initializing Clean Architecture...');

  // 1. Setup global error handling
  setupErrorHandling();

  // 2. Setup logger
  loggerInstance.setLevel(import.meta.env.DEV ? 'debug' : 'info');

  // 3. Setup store subscribers (optional)
  storeInstance.subscribe((newState) => {
    loggerInstance.debug('Store updated', newState);
  });

  // 4. Setup API interceptors
  apiClientInstance.useRequestInterceptor(async (config) => {
    loggerInstance.debug('API Request', { method: config.method, url: config.url });
    return config;
  });

  apiClientInstance.useResponseInterceptor(async (response) => {
    loggerInstance.debug('API Response', { status: response.status, url: response.url });
    return response;
  });

  loggerInstance.info('✅ Architecture initialized');

  return {
    store: storeInstance,
    apiClient: apiClientInstance,
    errorHandler: errorHandlerInstance,
    logger: loggerInstance
  };
}

/**
 * Quick Setup Utilities
 */

// Quick notification
export function notify(message, type = 'info', duration = 3000) {
  return storeInstance.addNotification(message, type, duration);
}

// Quick error
export function error(message, context = 'unknown') {
  return storeInstance.addError(message, context);
}

// Quick fetch
export async function fetchData(url, options = {}) {
  try {
    return await apiClientInstance.get(url, options);
  } catch (err) {
    errorHandlerInstance.handle(err);
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
