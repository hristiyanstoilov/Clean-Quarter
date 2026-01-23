import { describe, it, expect, vi } from 'vitest';
import * as client from '../src/api/client.js';

describe('client.js integration', () => {
  it('fetches data (mock)', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }));
    const data = await client.apiFetch('/test');
    expect(data).toBeDefined();
    expect(data.ok).toBe(true);
  });

  it('handles fetch error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('fail')));
    await expect(client.apiFetch('/fail')).rejects.toThrow('fail');
  });
});
