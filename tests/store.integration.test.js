import { describe, it, expect, vi } from 'vitest';
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
    store.set('persistKey', 'persistValue');
    expect(global.localStorage.getItem('persistKey')).toBe('persistValue');
  });
});
