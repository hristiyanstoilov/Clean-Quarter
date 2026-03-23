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

describe('ERROR_TYPES', () => {
  it('has standard error types defined', () => {
    ['AUTH', 'VALIDATION', 'NETWORK', 'PERMISSION'].forEach((type) => {
      expect(ERROR_TYPES).toHaveProperty(type);
    });
  });
});
