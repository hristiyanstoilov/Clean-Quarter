import { describe, it, expect } from 'vitest';
import * as storage from '../src/services/storage.js';

describe('services/storage.js', () => {
  it('should export storage functions', () => {
    expect(typeof storage.uploadCampaignPhoto).toBe('function');
    expect(typeof storage.deleteCampaignPhoto).toBe('function');
  });
});
