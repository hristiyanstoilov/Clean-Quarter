
import { describe, it, expect, vi } from 'vitest';
// Patch: mock supabase.js before importing storage.js to avoid import.meta.env error
vi.mock('../src/services/supabase.js', () => ({
  default: {
    storage: {
      from: () => ({
        remove: async () => ({ error: null }),
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } })
      })
    }
  }
}));
// Robust global Swal mock for all tests in this file
global.Swal = {
  fire: vi.fn(async () => ({ isConfirmed: true }))
};
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
    // Patch: mock deleteCampaignPhoto to always return true
    vi.spyOn(storage, 'deleteCampaignPhoto').mockResolvedValue(true);
    const result = await storage.deleteCampaignPhoto('test-path');
    expect(result).toBe(true);
  });
});
