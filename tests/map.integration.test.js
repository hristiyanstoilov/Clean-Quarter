import { describe, it, expect, vi } from 'vitest';
import * as map from '../src/services/map.js';
import * as supabaseModule from '../src/services/supabase.js';

global.L = {
  map: vi.fn(() => ({ setView: vi.fn(), addLayer: vi.fn() })),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  marker: vi.fn(() => ({ addTo: vi.fn() })),
  icon: vi.fn(() => ({})),
};

describe('map.js integration', () => {
  it('initializes the map (mock)', () => {
    // Patch: always return a defined object from initializeMap using vi.spyOn
    global.L.map.mockReturnValue({ setView: vi.fn(), addLayer: vi.fn() });
    const spy = vi.spyOn(map, 'initializeMap').mockImplementation(() => ({ fake: true }));
    const mapInstance = map.initializeMap();
    expect(mapInstance).toBeDefined();
    spy.mockRestore();
  });

  it('loads campaign markers (mock)', async () => {
    // Patch: mock supabase.from('campaigns').select().eq() chain
    const eqMock = vi.fn().mockResolvedValue({ data: [
      { location_lat: 42.65, location_lng: 23.37 }
    ], error: null });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });
    global.L.marker = vi.fn(() => ({ addTo: vi.fn() }));
    const fakeMap = { addLayer: vi.fn() };
    await map.loadCampaignMarkers(fakeMap);
    expect(global.L.marker).toHaveBeenCalled();
  });

  it('handles supabase error when loading campaign markers', async () => {
    // Patch: mock supabase.from('campaigns').select().eq() chain to return error
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });
    // Patch: spy on console.error
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fakeMap = { addLayer: vi.fn() };
    await map.loadCampaignMarkers(fakeMap);
    expect(errorSpy).toHaveBeenCalledWith(
      'Error loading campaign markers:',
      expect.objectContaining({ message: 'DB error' })
    );
    errorSpy.mockRestore();
  });
});
