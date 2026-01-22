import { describe, it, expect } from 'vitest';
import * as auth from '../src/services/auth.js';

describe('services/auth.js', () => {
  it('should export auth functions', () => {
    expect(typeof auth.register).toBe('function');
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(typeof auth.getUser).toBe('function');
  });
});
