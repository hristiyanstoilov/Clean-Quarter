import { describe, it, expect } from 'vitest';
import Logger from '../src/services/logger.js';

describe('services/logger.js', () => {
  it('should create a Logger instance', () => {
    expect(Logger).toBeInstanceOf(Object);
  });
});
