import * as store from '../src/state/store.js';

describe('store.js integration', () => {
  it('sets and gets state', () => {
    store.set('testKey', 'testValue');
    expect(store.get('testKey')).toBe('testValue');
  });

  it('removes state', () => {
    store.set('removeKey', 'toRemove');
    store.remove('removeKey');
    expect(store.get('removeKey')).toBeUndefined();
  });

  it('persists state to localStorage', () => {
    // Patch: ensure localStorage is defined for this test
    global.localStorage = global.localStorage || {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = value; },
      removeItem(key) { delete this.store[key]; },
      clear() { this.store = {}; }
    };
    store.set('persistKey', 'persistValue');
    // store.set() JSON.stringify()s values so raw localStorage contains the serialized form
    expect(JSON.parse(global.localStorage.getItem('persistKey'))).toBe('persistValue');
  });
});
