import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {},
}));
import * as storage from '../src/services/storage.js';

describe('services/storage.js', () => {
  it('should export storage functions', () => {
    expect(typeof storage.uploadCampaignPhoto).toBe('function');
    expect(typeof storage.deleteCampaignPhoto).toBe('function');
  });
});
