import { describe, it, expect, vi } from 'vitest';
import * as map from '../src/services/map.js';

global.L = {
  map: vi.fn(() => ({ setView: vi.fn(), addLayer: vi.fn() })),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  marker: vi.fn(() => ({ addTo: vi.fn() })),
};

describe('map.js integration', () => {
  it('initializes the map (mock)', () => {
    const mapInstance = map.initializeMap();
    expect(mapInstance).toBeDefined();
  });

  it('loads campaign markers (mock)', async () => {
    const fakeMap = {};
    await map.loadCampaignMarkers(fakeMap);
    expect(global.L.marker).toHaveBeenCalled();
  });
});
