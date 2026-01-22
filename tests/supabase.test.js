import { describe, it, expect } from 'vitest';
import supabase from '../src/services/supabase.js';

describe('services/supabase.js', () => {
  it('should export supabase object', () => {
    expect(typeof supabase).toBe('object');
  });
});
