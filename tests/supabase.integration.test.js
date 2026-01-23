import { describe, it, expect, vi } from 'vitest';
import * as supabase from '../src/services/supabase.js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [{ id: 1, title: 'Test' }], error: null })),
      insert: vi.fn(() => ({ data: [{ id: 2 }], error: null })),
    })),
    auth: {
      signInWithPassword: vi.fn(() => ({ data: { user: { id: 1 } }, error: null })),
      signUp: vi.fn(() => ({ data: { user: { id: 2 } }, error: null })),
    },
  })),
}));

describe('supabase.js integration', () => {
  it('fetches campaigns', async () => {
    const { fetchCampaigns } = await import('../src/services/supabase.js');
    const result = await fetchCampaigns();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('creates campaign', async () => {
    const { createCampaign } = await import('../src/services/supabase.js');
    const data = await createCampaign({ title: 'Test', description: 'desc' });
    expect(data).toBeDefined();
    expect(data[0].id).toBe(2);
  });
});
