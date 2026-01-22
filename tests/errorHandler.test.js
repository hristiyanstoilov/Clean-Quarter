import { describe, it, expect } from 'vitest';
import errorHandler, { ERROR_TYPES, AppError, setupGlobalErrorHandling } from '../src/services/errorHandler.js';

describe('services/errorHandler.js', () => {
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
