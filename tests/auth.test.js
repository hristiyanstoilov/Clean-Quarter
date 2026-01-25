import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {},
}));
import * as auth from '../src/services/auth.js';

describe('services/auth.js', () => {
  it('should export auth functions', () => {
    expect(typeof auth.register).toBe('function');
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(typeof auth.getUser).toBe('function');
  });
});
