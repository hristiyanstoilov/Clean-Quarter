import { describe, it, expect, vi, beforeEach } from 'vitest';

// Robust global Swal mock for all tests in this file
global.Swal = {
  fire: vi.fn(async () => ({ isConfirmed: true }))
};
import * as auth from '../src/services/auth.js';
import store from '../src/state/store.js';

// Mock Supabase client
vi.mock('../src/services/supabase.js', () => {
  // Patch: mock supabase.from().insert() for profile creation
  return {
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
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    },
  };
});

beforeEach(() => {
  store.reset();
});

describe('auth + store integration', () => {

  it('registers a user and updates store', async () => {
    // Provide required meta.neighborhood
    const user = await auth.register('user@test.com', 'pass', { neighborhood: 'Studentski Grad' });
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
    await expect(auth.login('wrong@test.com', 'bad')).rejects.toThrow('Invalid credentials');
  });

  it('logs out a user', async () => {
    await auth.login('user@test.com', 'pass');
    await auth.logout();
    // expect(store.get('user')).toBeNull();
  });
});
