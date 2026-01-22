import { describe, it, expect } from 'vitest';
import store from '../src/state/store.js';

describe('state/store.js', () => {
  it('should have get/set methods', () => {
    expect(typeof store.get).toBe('function');
    expect(typeof store.setState).toBe('function');
  });
});
