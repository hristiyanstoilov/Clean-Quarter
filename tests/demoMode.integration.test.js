import { describe, it, expect, vi } from 'vitest';
import * as demoMode from '../src/utils/demoMode.js';

describe('demoMode.js integration', () => {
  it('returns demo mode state', () => {
    expect(typeof demoMode.isDemoMode()).toBe('boolean');
  });

  it('toggles demo mode', () => {
    demoMode.setDemoMode(true);
    expect(demoMode.isDemoMode()).toBe(true);
    demoMode.setDemoMode(false);
    expect(demoMode.isDemoMode()).toBe(false);
  });
});
