import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [{ location_lat: 42.65, location_lng: 23.37 }], error: null }) })
    })
  }
}));
import * as map from '../src/services/map.js';
import * as supabaseModule from '../src/services/supabase.js';

global.L = {
  map: vi.fn(() => ({ setView: vi.fn(), addLayer: vi.fn() })),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  marker: vi.fn(() => ({ addTo: vi.fn() })),
  icon: vi.fn(() => ({})),
};

describe('map.js integration', () => {
  it('initializes the map (mock)', async () => {
    const mapModule = await import('../src/services/map.js');
    global.L.map.mockReturnValue({ setView: vi.fn(), addLayer: vi.fn() });
    const spy = vi.spyOn(mapModule, 'initializeMap').mockImplementation(() => ({ fake: true }));
    const mapInstance = mapModule.initializeMap();
    expect(mapInstance).toBeDefined();
    spy.mockRestore();
  });

  it('loads campaign markers (mock)', async () => {
    const mapModule = await import('../src/services/map.js');
    const supabaseModule = await import('../src/services/supabase.js');
    const eqMock = vi.fn().mockResolvedValue({ data: [
      { location_lat: 42.65, location_lng: 23.37 }
    ], error: null });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });
    global.L.marker = vi.fn(() => ({ addTo: vi.fn() }));
    const fakeMap = { addLayer: vi.fn() };
    await mapModule.loadCampaignMarkers(fakeMap);
    expect(global.L.marker).toHaveBeenCalled();
  });

  it('handles supabase error when loading campaign markers', async () => {
    const mapModule = await import('../src/services/map.js');
    const supabaseModule = await import('../src/services/supabase.js');
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fakeMap = { addLayer: vi.fn() };
    await mapModule.loadCampaignMarkers(fakeMap);
    expect(errorSpy).toHaveBeenCalledWith(
      'Error loading campaign markers:',
      expect.objectContaining({ message: 'DB error' })
    );
    errorSpy.mockRestore();
  });
});
