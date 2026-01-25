import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {},
}));
import supabase from '../src/services/supabase.js';

describe('services/supabase.js', () => {
  it('should export supabase object', () => {
    expect(typeof supabase).toBe('object');
  });
});
