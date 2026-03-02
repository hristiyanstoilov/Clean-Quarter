// vi.mock is hoisted automatically — runs before any imports
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      addLayer: vi.fn(),
      on: vi.fn(),
      invalidateSize: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
    })),
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock('../src/services/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [{ location_lat: 42.65, location_lng: 23.37 }],
            error: null,
          }),
      }),
    }),
  },
}));

import * as mapModule from '../src/services/map.js';
import L from 'leaflet';
import * as supabaseModule from '../src/services/supabase.js';

describe('map.js integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializeMap calls L.map("map") and L.tileLayer with OSM URL', () => {
    const result = mapModule.initializeMap();

    expect(L.map).toHaveBeenCalledWith('map');
    expect(L.tileLayer).toHaveBeenCalledWith(
      expect.stringContaining('openstreetmap.org'),
      expect.objectContaining({ maxZoom: 19 })
    );
    const tileInstance = L.tileLayer.mock.results[0].value;
    expect(tileInstance.addTo).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('createMarkerIcon returns a divIcon with correct geometry for each color', () => {
    for (const color of ['red', 'green', 'blue']) {
      vi.clearAllMocks();
      mapModule.createMarkerIcon(color);
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: [24, 36],
          iconAnchor: [12, 36],
          popupAnchor: [0, -36],
          className: '',
        })
      );
    }
  });

  it('createMarkerIcon falls back to red (#e74c3c) for unknown colors', () => {
    mapModule.createMarkerIcon('purple');
    const call = L.divIcon.mock.calls[0][0];
    expect(call.html).toContain('#e74c3c');
  });

  it('loads campaign markers and creates L.marker with divIcon', async () => {
    const eqMock = vi.fn().mockResolvedValue({
      data: [{ location_lat: 42.65, location_lng: 23.37 }],
      error: null,
    });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });

    const fakeMap = { addLayer: vi.fn() };
    await mapModule.loadCampaignMarkers(fakeMap);

    expect(L.marker).toHaveBeenCalled();
    expect(L.divIcon).toHaveBeenCalled();
  });

  it('handles supabase error when loading campaign markers', async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    vi.spyOn(supabaseModule.default, 'from').mockReturnValue({ select: selectMock });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fakeMap = { addLayer: vi.fn() };
    await mapModule.loadCampaignMarkers(fakeMap);

    expect(errorSpy).toHaveBeenCalled();
    const firstCall = errorSpy.mock.calls[0];
    expect(firstCall[0]).toContain('Error loading campaign markers');
    errorSpy.mockRestore();
  });

  it('loadMapData creates markers for both campaigns and disposal points', async () => {
    vi.spyOn(supabaseModule.default, 'from').mockImplementation((table) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: '1', title: 'Test', status: 'active', location_lat: 42.65, location_lng: 23.37 }],
              error: null,
            }),
          })),
        };
      }
      // disposal_points — no .eq(), select() resolves directly
      return {
        select: vi.fn().mockResolvedValue({
          data: [{ id: '2', name: 'Bin', description: '', latitude: 42.66, longitude: 23.38 }],
          error: null,
        }),
      };
    });

    const fakeMap = { addLayer: vi.fn() };
    await mapModule.loadMapData(fakeMap);

    // Both loaders create markers → L.marker called at least twice
    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.divIcon).toHaveBeenCalledTimes(2);
  });
});
