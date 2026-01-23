import { describe, it, expect, vi } from 'vitest';
import * as storage from '../src/services/storage.js';

global.URL = { createObjectURL: vi.fn(() => 'blob:url') };

describe('storage.js integration', () => {
  it('uploads a campaign photo (mock)', async () => {
    // Mock file
    const file = new Blob(['test'], { type: 'image/png' });
    // Mock Supabase storage
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ url: 'mock-url' }) })));
    const url = await storage.uploadCampaignPhoto(file, 'test-folder');
    expect(url).toBeDefined();
  });

  it('deletes a campaign photo (mock)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    const result = await storage.deleteCampaignPhoto('test-path');
    expect(result).toBe(true);
  });
});
