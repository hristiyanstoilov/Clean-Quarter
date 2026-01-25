// Auto-mock Supabase for all tests if config is missing
import { beforeAll } from 'vitest';

beforeAll(() => {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    vi.mock('../src/services/supabase.js', () => ({
      default: {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: [], error: null }),
          eq: () => ({ data: [], error: null })
        }),
        auth: {
          signUp: () => ({ data: { user: { id: 'mock' } }, error: null }),
          signInWithPassword: () => ({ data: { user: { id: 'mock' } }, error: null }),
          signOut: () => ({ error: null }),
          getUser: () => ({ data: { user: { id: 'mock' } }, error: null })
        },
        storage: {
          from: () => ({
            upload: () => ({ error: null }),
            remove: () => ({ error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } })
          })
        }
      },
      fetchCampaigns: async () => [],
      createCampaign: async (data) => [{ id: 'mock', ...data }],
    }));
  }
});
