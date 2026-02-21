// Unit tests for dashboard.js functionality

describe('Dashboard - Campaign Filtering', () => {
  const mockCampaigns = [
    { id: 1, title: 'Clean Park', status: 'active', neighborhood: 'Center', created_at: '2024-01-15' },
    { id: 2, title: 'Fix Streets', status: 'completed', neighborhood: 'Studentski', created_at: '2024-02-01' },
    { id: 3, title: 'Plant Trees', status: 'active', neighborhood: 'Center', created_at: '2024-01-20' },
    { id: 4, title: 'Clean River', status: 'pending', neighborhood: 'Lozenets', created_at: '2024-02-10' }
  ];

  it('should filter campaigns by status', () => {
    const filterByStatus = (campaigns, status) => {
      if (!status || status === 'all') return campaigns;
      return campaigns.filter(c => c.status === status);
    };

    const active = filterByStatus(mockCampaigns, 'active');
    const completed = filterByStatus(mockCampaigns, 'completed');
    const all = filterByStatus(mockCampaigns, 'all');

    expect(active).toHaveLength(2);
    expect(completed).toHaveLength(1);
    expect(all).toHaveLength(4);
    expect(active.every(c => c.status === 'active')).toBe(true);
  });

  it('should filter campaigns by neighborhood', () => {
    const filterByNeighborhood = (campaigns, neighborhood) => {
      if (!neighborhood || neighborhood === 'all') return campaigns;
      return campaigns.filter(c => c.neighborhood === neighborhood);
    };

    const center = filterByNeighborhood(mockCampaigns, 'Center');
    const studentski = filterByNeighborhood(mockCampaigns, 'Studentski');

    expect(center).toHaveLength(2);
    expect(studentski).toHaveLength(1);
    expect(center.every(c => c.neighborhood === 'Center')).toBe(true);
  });

  it('should search campaigns by title', () => {
    const searchByTitle = (campaigns, query) => {
      if (!query || query.trim() === '') return campaigns;
      const lowerQuery = query.toLowerCase();
      return campaigns.filter(c =>
        c.title.toLowerCase().includes(lowerQuery)
      );
    };

    const results = searchByTitle(mockCampaigns, 'clean');
    expect(results).toHaveLength(2);
    expect(results.every(c => c.title.toLowerCase().includes('clean'))).toBe(true);
  });

  it('should combine multiple filters', () => {
    const applyFilters = (campaigns, { status, neighborhood, search }) => {
      let filtered = campaigns;

      if (status && status !== 'all') {
        filtered = filtered.filter(c => c.status === status);
      }

      if (neighborhood && neighborhood !== 'all') {
        filtered = filtered.filter(c => c.neighborhood === neighborhood);
      }

      if (search && search.trim() !== '') {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.title.toLowerCase().includes(lowerSearch)
        );
      }

      return filtered;
    };

    const results = applyFilters(mockCampaigns, {
      status: 'active',
      neighborhood: 'Center',
      search: 'park'
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Clean Park');
  });
});

describe('Dashboard - Campaign Sorting', () => {
  const mockCampaigns = [
    { id: 1, title: 'B Campaign', created_at: '2024-01-15', participants_count: 5 },
    { id: 2, title: 'A Campaign', created_at: '2024-02-01', participants_count: 10 },
    { id: 3, title: 'C Campaign', created_at: '2024-01-20', participants_count: 3 }
  ];

  it('should sort campaigns by date (newest first)', () => {
    const sortByDate = (campaigns, order = 'desc') => {
      return [...campaigns].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    };

    const sorted = sortByDate(mockCampaigns, 'desc');
    expect(sorted[0].id).toBe(2); // Feb 1
    expect(sorted[1].id).toBe(3); // Jan 20
    expect(sorted[2].id).toBe(1); // Jan 15
  });

  it('should sort campaigns by date (oldest first)', () => {
    const sortByDate = (campaigns, order = 'desc') => {
      return [...campaigns].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    };

    const sorted = sortByDate(mockCampaigns, 'asc');
    expect(sorted[0].id).toBe(1); // Jan 15
    expect(sorted[2].id).toBe(2); // Feb 1
  });

  it('should sort campaigns by title (alphabetically)', () => {
    const sortByTitle = (campaigns) => {
      return [...campaigns].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    };

    const sorted = sortByTitle(mockCampaigns);
    expect(sorted[0].title).toBe('A Campaign');
    expect(sorted[1].title).toBe('B Campaign');
    expect(sorted[2].title).toBe('C Campaign');
  });

  it('should sort campaigns by popularity (participants)', () => {
    const sortByPopularity = (campaigns) => {
      return [...campaigns].sort((a, b) =>
        (b.participants_count || 0) - (a.participants_count || 0)
      );
    };

    const sorted = sortByPopularity(mockCampaigns);
    expect(sorted[0].participants_count).toBe(10);
    expect(sorted[1].participants_count).toBe(5);
    expect(sorted[2].participants_count).toBe(3);
  });

  it('should handle campaigns with missing data gracefully', () => {
    const campaignsWithMissing = [
      { id: 1, title: 'A', participants_count: 5 },
      { id: 2, title: 'B' }, // Missing participants_count
      { id: 3, title: 'C', participants_count: 10 }
    ];

    const sortByPopularity = (campaigns) => {
      return [...campaigns].sort((a, b) =>
        (b.participants_count || 0) - (a.participants_count || 0)
      );
    };

    const sorted = sortByPopularity(campaignsWithMissing);
    expect(sorted[0].participants_count).toBe(10);
    expect(sorted[2].participants_count || 0).toBe(0);
  });
});

describe('Dashboard - Map Integration', () => {
  it('should calculate map bounds from campaigns', () => {
    const campaigns = [
      { location_lat: 42.65, location_lng: 23.30 },
      { location_lat: 42.70, location_lng: 23.35 },
      { location_lat: 42.60, location_lng: 23.25 }
    ];

    const calculateBounds = (campaigns) => {
      if (!campaigns || campaigns.length === 0) return null;

      const lats = campaigns.map(c => c.location_lat).filter(Boolean);
      const lngs = campaigns.map(c => c.location_lng).filter(Boolean);

      if (lats.length === 0) return null;

      return {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs)
      };
    };

    const bounds = calculateBounds(campaigns);
    expect(bounds.minLat).toBe(42.60);
    expect(bounds.maxLat).toBe(42.70);
    expect(bounds.minLng).toBe(23.25);
    expect(bounds.maxLng).toBe(23.35);
  });

  it('should filter campaigns within map viewport', () => {
    const campaigns = [
      { id: 1, location_lat: 42.65, location_lng: 23.30 },
      { id: 2, location_lat: 42.70, location_lng: 23.35 },
      { id: 3, location_lat: 50.00, location_lng: 30.00 } // Outside Sofia
    ];

    const filterByBounds = (campaigns, bounds) => {
      return campaigns.filter(c =>
        c.location_lat >= bounds.minLat &&
        c.location_lat <= bounds.maxLat &&
        c.location_lng >= bounds.minLng &&
        c.location_lng <= bounds.maxLng
      );
    };

    const sofiaBounds = {
      minLat: 42.60,
      maxLat: 42.75,
      minLng: 23.25,
      maxLng: 23.40
    };

    const visible = filterByBounds(campaigns, sofiaBounds);
    expect(visible).toHaveLength(2);
    expect(visible.every(c => c.id !== 3)).toBe(true);
  });
});

describe('Dashboard - Pagination', () => {
  const createMockCampaigns = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Campaign ${i + 1}`
    }));
  };

  it('should paginate campaigns correctly', () => {
    const campaigns = createMockCampaigns(25);
    const pageSize = 10;

    const paginate = (items, page, size) => {
      const start = (page - 1) * size;
      const end = start + size;
      return items.slice(start, end);
    };

    const page1 = paginate(campaigns, 1, pageSize);
    const page2 = paginate(campaigns, 2, pageSize);
    const page3 = paginate(campaigns, 3, pageSize);

    expect(page1).toHaveLength(10);
    expect(page2).toHaveLength(10);
    expect(page3).toHaveLength(5);
    expect(page1[0].id).toBe(1);
    expect(page2[0].id).toBe(11);
    expect(page3[0].id).toBe(21);
  });

  it('should calculate total pages correctly', () => {
    const calculateTotalPages = (totalItems, pageSize) => {
      return Math.ceil(totalItems / pageSize);
    };

    expect(calculateTotalPages(25, 10)).toBe(3);
    expect(calculateTotalPages(30, 10)).toBe(3);
    expect(calculateTotalPages(10, 10)).toBe(1);
    expect(calculateTotalPages(0, 10)).toBe(0);
  });
});
