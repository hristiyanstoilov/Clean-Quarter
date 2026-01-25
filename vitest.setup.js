// Global test setup for Vitest

// Mock SweetAlert2 (Swal)
global.Swal = {
  fire: (...args) => {
    // Optionally log or track calls
    return Promise.resolve({ isConfirmed: true, ...args[0] });
  }
};

// Mock localStorage if not present
global.localStorage = global.localStorage || {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value; },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
import './tests/global-supabase-mock.js';
