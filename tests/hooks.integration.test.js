import { describe, it, expect, vi } from 'vitest';
import * as hooks from '../src/hooks/index.js';

describe('hooks/index.js integration', () => {
  it('calls useAuth (mock)', () => {
    const result = hooks.useAuth();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('calls useCampaigns (mock)', () => {
    const result = hooks.useCampaigns();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
