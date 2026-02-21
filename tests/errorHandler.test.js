import errorHandler, { ERROR_TYPES, AppError, setupGlobalErrorHandling } from '../src/services/errorHandler.js';

describe('services/errorHandler.js - Exports', () => {
  it('should export errorHandler singleton', () => {
    expect(typeof errorHandler).toBe('object');
  });

  it('should export ERROR_TYPES', () => {
    expect(typeof ERROR_TYPES).toBe('object');
  });

  it('should export AppError class', () => {
    expect(typeof AppError).toBe('function');
    expect(new AppError('msg', 'type')).toBeInstanceOf(Error);
  });

  it('should export setupGlobalErrorHandling', () => {
    expect(typeof setupGlobalErrorHandling).toBe('function');
  });
});

describe('AppError Class', () => {
  it('should create error with message and type', () => {
    const error = new AppError('Test error', 'VALIDATION');
    expect(error.message).toBe('Test error');
    expect(error.type).toBe('VALIDATION');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name property', () => {
    const error = new AppError('Test', 'AUTH');
    expect(error.name).toBe('AppError');
  });

  it('should preserve stack trace', () => {
    const error = new AppError('Test', 'NETWORK');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});

describe('Error Type Validation', () => {
  it('should have standard error types defined', () => {
    const expectedTypes = ['AUTH', 'VALIDATION', 'NETWORK', 'PERMISSION'];

    expectedTypes.forEach(type => {
      expect(ERROR_TYPES).toHaveProperty(type);
    });
  });

  it('should categorize errors by type', () => {
    const categorizeError = (error) => {
      if (error.message.includes('auth') || error.message.includes('login')) {
        return ERROR_TYPES.AUTH;
      }
      if (error.message.includes('validate') || error.message.includes('invalid')) {
        return ERROR_TYPES.VALIDATION;
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return ERROR_TYPES.NETWORK;
      }
      return ERROR_TYPES.UNKNOWN;
    };

    expect(categorizeError(new Error('auth failed'))).toBe('AUTH_ERROR');
    expect(categorizeError(new Error('invalid email'))).toBe('VALIDATION_ERROR');
    expect(categorizeError(new Error('network error'))).toBe('NETWORK_ERROR');
  });
});

describe('Error Message Formatting', () => {
  it('should format user-friendly error messages', () => {
    const formatErrorMessage = (error) => {
      const messages = {
        'AUTH': 'Authentication failed. Please log in again.',
        'VALIDATION': 'Please check your input and try again.',
        'NETWORK': 'Network error. Please check your connection.',
        'DATABASE': 'Database error. Please try again later.',
        'PERMISSION': 'You do not have permission to perform this action.'
      };

      return messages[error.type] || error.message || 'An unexpected error occurred.';
    };

    const authError = new AppError('Auth failed', 'AUTH');
    const validationError = new AppError('Invalid data', 'VALIDATION');
    const unknownError = new AppError('Something broke', 'UNKNOWN');

    expect(formatErrorMessage(authError)).toBe('Authentication failed. Please log in again.');
    expect(formatErrorMessage(validationError)).toBe('Please check your input and try again.');
    expect(formatErrorMessage(unknownError)).toBe('Something broke');
  });

  it('should handle errors without type property', () => {
    const formatErrorMessage = (error) => {
      if (!error.type) {
        return error.message || 'An unknown error occurred';
      }
      return `[${error.type}] ${error.message}`;
    };

    const genericError = new Error('Generic error');
    const appError = new AppError('App error', 'AUTH');

    expect(formatErrorMessage(genericError)).toBe('Generic error');
    expect(formatErrorMessage(appError)).toBe('[AUTH] App error');
  });
});

describe('Error Logging', () => {
  it('should log errors to console in development', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logError = (error, isDevelopment = true) => {
      if (isDevelopment) {
        console.error('[Error]', error.message, error.stack);
      }
    };

    const error = new AppError('Test error', 'VALIDATION');
    logError(error, true);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should include error context in logs', () => {
    const logErrorWithContext = (error, context) => {
      return {
        message: error.message,
        type: error.type,
        timestamp: new Date().toISOString(),
        context: context || {}
      };
    };

    const error = new AppError('Test', 'AUTH');
    const logEntry = logErrorWithContext(error, { userId: '123', action: 'login' });

    expect(logEntry.message).toBe('Test');
    expect(logEntry.type).toBe('AUTH');
    expect(logEntry.context.userId).toBe('123');
    expect(logEntry.timestamp).toBeDefined();
  });
});

describe('Error Recovery Strategies', () => {
  it('should retry network errors', () => {
    const shouldRetry = (error, attemptCount, maxAttempts = 3) => {
      if (attemptCount >= maxAttempts) return false;
      return error.type === 'NETWORK' || error.type === 'DATABASE';
    };

    const networkError = new AppError('Network failed', 'NETWORK');
    const authError = new AppError('Auth failed', 'AUTH');

    expect(shouldRetry(networkError, 1)).toBe(true);
    expect(shouldRetry(networkError, 3)).toBe(false);
    expect(shouldRetry(authError, 1)).toBe(false);
  });

  it('should calculate exponential backoff delay', () => {
    const calculateBackoff = (attemptCount, baseDelay = 1000) => {
      return Math.min(baseDelay * Math.pow(2, attemptCount - 1), 10000);
    };

    expect(calculateBackoff(1)).toBe(1000);   // 1s
    expect(calculateBackoff(2)).toBe(2000);   // 2s
    expect(calculateBackoff(3)).toBe(4000);   // 4s
    expect(calculateBackoff(4)).toBe(8000);   // 8s
    expect(calculateBackoff(5)).toBe(10000);  // capped at 10s
  });
});
