import { describe, it, expect } from 'vitest';
import * as pwa from '../src/services/pwa.js';

describe('services/pwa.js', () => {
  it('should export PWA functions', () => {
    expect(typeof pwa.initializePWA).toBe('function');
    expect(typeof pwa.sendNotification).toBe('function');
    expect(typeof pwa.isOnline).toBe('function');
    expect(typeof pwa.isInstalledPWA).toBe('function');
    expect(typeof pwa.cacheData).toBe('function');
    expect(typeof pwa.getCachedData).toBe('function');
  });
});
