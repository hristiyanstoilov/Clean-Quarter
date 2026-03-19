import { vi } from 'vitest';

// Must mock env BEFORE importing helpers so hasLocalStorage() returns true in Node.js
vi.mock('../src/utils/env.js', () => ({
  isBrowser: () => false,
  hasLocalStorage: () => true,
  hasNavigator: () => false,
}));

import { saveUser, getCurrentUser } from '../src/utils/helpers.js';

// In-memory localStorage for Node.js
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] ?? null; },
  setItem(key, value) { this.store[key] = value; },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
};

beforeEach(() => {
  localStorage.clear();
});

describe('session TTL', () => {
  it('saveUser() stores saved_at timestamp', () => {
    const before = Date.now();
    saveUser({ id: 'u1', email: 'a@b.com', username: 'alice', role: 'user', neighborhood: 'SG' });
    const stored = JSON.parse(localStorage.getItem('user'));
    expect(stored.saved_at).toBeGreaterThanOrEqual(before);
    expect(stored.saved_at).toBeLessThanOrEqual(Date.now());
  });

  it('getCurrentUser() returns user within TTL', () => {
    saveUser({ id: 'u1', email: 'a@b.com' });
    const user = getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.id).toBe('u1');
  });

  it('getCurrentUser() returns null and clears entry for expired session', () => {
    const stale = { id: 'u1', email: 'a@b.com', saved_at: Date.now() - 9 * 60 * 60 * 1000 };
    localStorage.setItem('user', JSON.stringify(stale));
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('getCurrentUser() never expires demo user', () => {
    const demo = { id: 'demo-admin-001', email: 'admin@demo.com', saved_at: Date.now() - 9 * 60 * 60 * 1000 };
    localStorage.setItem('user', JSON.stringify(demo));
    const user = getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.id).toBe('demo-admin-001');
  });
});
