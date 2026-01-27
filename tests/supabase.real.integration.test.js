import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Read config from env (works in CI and locally)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only run if config is present
const canRun = !!supabaseUrl && !!supabaseAnonKey;

(canRun ? describe : describe.skip)('Supabase REAL integration', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  it('fetches campaigns from real Supabase', async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  // You can add more real queries here (read-only for safety)
});
