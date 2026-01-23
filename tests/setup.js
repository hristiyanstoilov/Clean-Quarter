

// --- GLOBAL MOCKS: Must be at the very top before any imports ---

function defineGlobalMocks() {
  // Robust localStorage mock (always redefine, allow reassignment)
  Object.defineProperty(global, 'localStorage', {
    value: {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = value; },
      removeItem(key) { delete this.store[key]; },
      clear() { this.store = {}; }
    },
    writable: true,
    configurable: true
  });

  // Robust Swal mock (always redefine)
  Object.defineProperty(global, 'Swal', {
    value: {
      fire: async () => Promise.resolve(),
    },
    writable: true,
    configurable: true
  });

  // Robust navigator mock (always redefine, allow reassignment)
  Object.defineProperty(global, 'navigator', {
    value: { userAgent: 'node-test', serviceWorker: {} },
    writable: true,
    configurable: true
  });

  // Robust window mock (always redefine)
  Object.defineProperty(global, 'window', {
    value: { location: { href: 'http://localhost/' } },
    writable: true,
    configurable: true
  });
}

defineGlobalMocks();

// Re-define mocks before each test to ensure isolation
if (typeof beforeEach === 'function') {
  beforeEach(() => {
    defineGlobalMocks();
  });
}
    configurable: true
  });
}
