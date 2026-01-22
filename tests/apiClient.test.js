import { describe, it, expect } from 'vitest';
import apiClient from '../src/api/client.js';

describe('api/client.js', () => {
  it('should export apiClient object', () => {
    expect(typeof apiClient).toBe('object');
  });
});
