import { beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = value; },
      removeItem(key) { delete this.store[key]; },
      clear() { this.store = {}; }
    };
  }
});
