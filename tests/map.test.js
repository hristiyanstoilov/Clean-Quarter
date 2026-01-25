import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/supabase.js', () => ({
  default: {},
}));
import * as map from '../src/services/map.js';

describe('services/map.js', () => {
  it('should export map functions', () => {
    expect(typeof map.initializeMap).toBe('function');
    expect(typeof map.loadCampaignMarkers).toBe('function');
    expect(typeof map.loadDisposalPointMarkers).toBe('function');
    expect(typeof map.loadMapData).toBe('function');
  });
});
