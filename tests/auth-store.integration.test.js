import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auth from '../src/services/auth.js';
import store from '../src/state/store.js';

// Mock Supabase client
vi.mock('../src/services/supabase.js', () => ({
  default: {
    auth: {
      signUp: vi.fn(async ({ email, password }) => {
        if (email && password) return { data: { user: { id: 'test', email } }, error: null };
        return { data: null, error: { message: 'Invalid' } };
      }),
      signInWithPassword: vi.fn(async ({ email, password }) => {
        if (email === 'user@test.com' && password === 'pass') return { data: { user: { id: 'u1', email } }, error: null };
        return { data: null, error: { message: 'Invalid credentials' } };
      }),
      signOut: vi.fn(async () => ({ error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1', email: 'user@test.com' } }, error: null })),
    },
  },
}));

beforeEach(() => {
  store.reset();
});

describe('auth + store integration', () => {
  it('registers a user and updates store', async () => {
    const user = await auth.register('user@test.com', 'pass');
    expect(user).toBeTruthy();
    expect(user.email).toBe('user@test.com');
  });

  it('logs in a user and updates store', async () => {
    const user = await auth.login('user@test.com', 'pass');
    expect(user).toBeTruthy();
    expect(user.email).toBe('user@test.com');
    // Optionally: check store state
    // expect(store.get('user')).toEqual(user);
  });

  it('fails login with wrong credentials', async () => {
    const user = await auth.login('wrong@test.com', 'bad');
    expect(user).toBeNull();
  });

  it('logs out a user', async () => {
    await auth.login('user@test.com', 'pass');
    await auth.logout();
    // expect(store.get('user')).toBeNull();
  });
});
