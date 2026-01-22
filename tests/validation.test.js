import { describe, it, expect } from 'vitest';
import * as validation from '../src/services/validation.js';

describe('services/validation.js', () => {
  it('should export validation functions', () => {
    expect(typeof validation.validateField).toBe('function');
    expect(typeof validation.validateForm).toBe('function');
    expect(typeof validation.validateWithSchema).toBe('function');
    expect(typeof validation.addRule).toBe('function');
    expect(typeof validation.addSchema).toBe('function');
    expect(typeof validation.getErrorMessage).toBe('function');
  });
});
