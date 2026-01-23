import { describe, it, expect, vi } from 'vitest';
import * as pwa from '../src/services/pwa.js';

describe('pwa.js integration', () => {
  it('registers service worker (mock)', async () => {
  global.navigator.serviceWorker = { register: vi.fn(() => Promise.resolve('ok')) };
    const result = await pwa.registerServiceWorker();
    expect(result).toBe('ok');
    expect(global.navigator.serviceWorker.register).toHaveBeenCalled();
  });

  it('handles no service worker support', async () => {
  delete global.navigator.serviceWorker;
    const result = await pwa.registerServiceWorker();
    expect(result).toBe(false);
  });
});
