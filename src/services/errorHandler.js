/**
 * Error Boundaries & Handlers
 * Centralized error handling and recovery
 */

import store from '../state/store.js';
import logger from './logger.js';

/**
 * Error Types
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      message: this.message,
      type: this.type,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Global Error Handler
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = new Set();
    this.errorStrategies = new Map();
    this.setupDefaultStrategies();
  }

  /**
   * Setup default error handling strategies
   */
  setupDefaultStrategies() {
    // Network errors
    this.registerStrategy(ERROR_TYPES.NETWORK, (error) => {
      store.notify('Network connection failed. Please check your internet.', 'error');
      logger.error('Network error', error);
    });

    // Auth errors
    this.registerStrategy(ERROR_TYPES.AUTH, (error) => {
      store.notify('Authentication failed. Please login again.', 'error');
      logger.warn('Auth error', error);
      // Redirect to login
      window.location.href = '/index.html';
    });

    // Validation errors
    this.registerStrategy(ERROR_TYPES.VALIDATION, (error) => {
      store.notify(`Validation error: ${error.message}`, 'error');
      logger.info('Validation error', error.details);
    });

    // API errors
    this.registerStrategy(ERROR_TYPES.API, (error) => {
      const message = error.details?.message || 'API request failed';
      store.notify(message, 'error');
      logger.error('API error', error);
    });

    // Permission errors
    this.registerStrategy(ERROR_TYPES.PERMISSION, (error) => {
      store.notify('You do not have permission to perform this action.', 'error');
      logger.warn('Permission denied', error);
    });

    // Not found errors
    this.registerStrategy(ERROR_TYPES.NOT_FOUND, (error) => {
      store.notify('Resource not found.', 'error');
      logger.info('Resource not found', error.details);
    });

    // Server errors
    this.registerStrategy(ERROR_TYPES.SERVER, (error) => {
      store.notify('Server error. Please try again later.', 'error');
      logger.error('Server error', error);
    });

    // Unknown errors
    this.registerStrategy(ERROR_TYPES.UNKNOWN, (error) => {
      store.notify('An unexpected error occurred.', 'error');
      logger.fatal('Unknown error', error);
    });
  }

  /**
   * Register custom error handling strategy
   */
  registerStrategy(errorType, handler) {
    this.errorStrategies.set(errorType, handler);
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Handle error
   */
  handle(error) {
    // Normalize error
    let appError = error instanceof AppError
      ? error
      : new AppError(error?.message || 'Unknown error', ERROR_TYPES.UNKNOWN, error);

    // Store error in store
    store.addError(appError.message, appError.type);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (err) {
        logger.error('Error listener failed', err);
      }
    });

    // Execute strategy
    const strategy = this.errorStrategies.get(appError.type);
    if (strategy) {
      try {
        strategy(appError);
      } catch (err) {
        logger.error('Error strategy failed', err);
      }
    }

    return appError;
  }

  /**
   * Handle async errors
   */
  async handleAsync(asyncFn, context = 'async operation') {
    try {
      return await asyncFn();
    } catch (error) {
      logger.error(`Error in ${context}`, error);
      this.handle(error);
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retry(asyncFn, maxAttempts = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;
        logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying...`, {
          error: error.message
        });

        if (attempt < maxAttempts) {
          const backoffDelay = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    this.handle(lastError);
    throw lastError;
  }

  /**
   * Safe function execution
   */
  safe(fn, ...args) {
    try {
      return fn(...args);
    } catch (error) {
      this.handle(error);
      return null;
    }
  }

  /**
   * Safe async function execution
   */
  async safeAsync(asyncFn, ...args) {
    try {
      return await asyncFn(...args);
    } catch (error) {
      this.handle(error);
      return null;
    }
  }

  /**
   * Get error messages for form
   */
  getFormErrors(error) {
    if (error.type === ERROR_TYPES.VALIDATION) {
      return error.details || {};
    }
    return {};
  }

  /**
   * Get all errors
   */
  getAllErrors() {
    return store.state.errors;
  }

  /**
   * Clear errors
   */
  clearErrors() {
    store.clearErrors();
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export singleton
export default errorHandler;

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.fatal('Unhandled promise rejection', event.reason);
    errorHandler.handle(event.reason);
  });

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    logger.fatal('Unhandled error', event.error);
    errorHandler.handle(event.error);
  });

  logger.info('Global error handling initialized');
}
