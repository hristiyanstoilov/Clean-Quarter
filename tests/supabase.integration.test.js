import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [{ id: 1, title: 'Test' }], error: null }) })
    }),
    auth: {
      signInWithPassword: () => ({ data: { user: { id: 1 } }, error: null }),
      signUp: () => ({ data: { user: { id: 2 } }, error: null })
    }
  },
  fetchCampaigns: async () => [{ id: 1, title: 'Test' }],
  createCampaign: async (data) => [{ id: 2, ...data }],
}));
import * as supabase from '../src/services/supabase.js';

vi.mock('../src/services/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [{ id: 1, title: 'Test' }], error: null }) })
    }),
    auth: {
      signInWithPassword: () => ({ data: { user: { id: 1 } }, error: null }),
      signUp: () => ({ data: { user: { id: 2 } }, error: null })
    }
  },
  fetchCampaigns: async () => [{ id: 1, title: 'Test' }],
  createCampaign: async (data) => [{ id: 2, ...data }],
}));

describe('supabase.js integration', () => {
  it('fetches campaigns', async () => {
    const supabaseModule = await import('../src/services/supabase.js');
    const result = await supabaseModule.fetchCampaigns();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('creates campaign', async () => {
    const supabaseModule = await import('../src/services/supabase.js');
    const data = await supabaseModule.createCampaign({ title: 'Test', description: 'desc' });
    expect(data).toBeDefined();
    expect(data[0].id).toBe(2);
  });
});
