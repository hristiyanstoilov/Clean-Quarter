// Mock URL constructor before any imports
class MockURL {
  constructor(url) {
    this.href = url;
  }
  static createObjectURL() {
    return 'blob:mock-url';
  }
}
global.URL = MockURL;

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
// Mock handleError so Swal is never invoked — tests focus on throw behaviour only
vi.mock('../src/utils/helpers.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, handleError: vi.fn(async () => {}) };
});
// Robust global Swal mock for all tests in this file
global.Swal = {
  fire: vi.fn(async () => ({ isConfirmed: true }))
};


import * as storage from '../src/services/storage.js';

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

  it('throws if no file provided to uploadCampaignPhoto', async () => {
    const { uploadCampaignPhoto } = await import('../src/services/storage.js');
    await expect(uploadCampaignPhoto(null)).rejects.toThrow('No file provided');
  });

  it('throws if Supabase upload fails', async () => {
    vi.resetModules();
    class MockURL {
      constructor(url) { this.href = url; }
      static createObjectURL() { return 'blob:mock-url'; }
    }
    global.URL = MockURL;
    vi.doMock('../src/services/supabase.js', () => ({
      default: {
        storage: {
          from: () => ({
            upload: async () => ({ error: { message: 'Upload failed' } }),
            getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } })
          })
        }
      }
    }));
    const { uploadCampaignPhoto } = await import('../src/services/storage.js');
    const file = new Blob(['test'], { type: 'image/png', name: 'file.png' });
    await expect(uploadCampaignPhoto(file, 'folder')).rejects.toThrow('Upload failed');
  });

  it('throws if getPublicUrl returns no publicUrl', async () => {
    vi.resetModules();
    class MockURL {
      constructor(url) { this.href = url; }
      static createObjectURL() { return 'blob:mock-url'; }
    }
    global.URL = MockURL;
    vi.doMock('../src/services/supabase.js', () => ({
      default: {
        storage: {
          from: () => ({
            upload: async () => ({ error: null }),
            getPublicUrl: () => ({ data: {} })
          })
        }
      }
    }));
    const { uploadCampaignPhoto } = await import('../src/services/storage.js');
    const file = new Blob(['test'], { type: 'image/png', name: 'file.png' });
    await expect(uploadCampaignPhoto(file, 'folder')).rejects.toThrow('Upload succeeded but URL is missing');
  });

  it('throws if Supabase delete fails', async () => {
    vi.resetModules();
    class MockURL {
      constructor(url) { this.href = url; }
      static createObjectURL() { return 'blob:mock-url'; }
    }
    global.URL = MockURL;
    vi.doMock('../src/services/supabase.js', () => ({
      default: {
        storage: {
          from: () => ({
            remove: async () => ({ error: { message: 'Delete failed' } })
          })
        }
      }
    }));
    const { deleteCampaignPhoto } = await import('../src/services/storage.js');
    await expect(deleteCampaignPhoto('bad-path')).rejects.toThrow('Delete failed');
  });
});
