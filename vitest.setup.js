// Global test setup for Vitest

// Mock SweetAlert2 (Swal) — vi.fn() so tests can spy on calls
global.Swal = {
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  close: vi.fn(),
  showLoading: vi.fn(),
};

// Mock localStorage if not present
global.localStorage = global.localStorage || {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value; },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Mock window for redirect testing in page scripts
if (typeof global.window === 'undefined') {
  global.window = {};
}
global.window.location = global.window.location || { href: '' };
global.window.addEventListener = global.window.addEventListener || (() => {});
global.window.removeEventListener = global.window.removeEventListener || (() => {});
global.window.dispatchEvent = global.window.dispatchEvent || (() => {});

// Mock document for page script module-level code (DOMContentLoaded listener, window.handleBuy assignment)
if (typeof global.document === 'undefined') {
  global.document = {
    addEventListener: () => {},
    getElementById: () => ({ disabled: false, style: {}, textContent: '', innerHTML: '', value: '', addEventListener: () => {}, removeEventListener: () => {} }),
    querySelectorAll: () => [],
    querySelector: () => null,
    documentElement: { lang: '' },
  };
}
