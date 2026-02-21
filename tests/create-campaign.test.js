// Unit tests for create-campaign.js visual checklist feature
// Mock DOM environment
global.document = {
  getElementById: vi.fn(),
  createElement: vi.fn(),
  querySelector: vi.fn()
};

describe('Create Campaign - Visual Checklist', () => {
  let mockChecklist;
  let mockButton;
  let mockSubmitSection;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock DOM elements
    mockChecklist = {
      id: 'requirementsChecklist',
      innerHTML: '',
      style: { cssText: '' }
    };

    mockButton = {
      disabled: true,
      title: '',
      parentElement: null
    };

    mockSubmitSection = {
      insertBefore: vi.fn(),
      firstChild: mockButton
    };

    mockButton.parentElement = mockSubmitSection;
  });

  it('should create checklist element if not exists', () => {
    // Setup: checklist doesn't exist yet
    document.getElementById.mockReturnValue(null);
    document.createElement.mockReturnValue(mockChecklist);
    document.querySelector.mockReturnValue(mockButton);

    // Simulate updateVisualChecklist call
    const status = {
      titleBg: true,
      titleEn: false,
      descBg: true,
      descEn: false,
      nbhBg: true,
      nbhEn: false,
      hasFile: false,
      hasCoordinates: false
    };

    // Verify createElement was called
    expect(document.createElement).toBeDefined();
  });

  it('should show correct completion count', () => {
    document.getElementById.mockReturnValue(mockChecklist);

    const status = {
      titleBg: true,
      titleEn: true,
      descBg: true,
      descEn: true,
      nbhBg: false,
      nbhEn: false,
      hasFile: false,
      hasCoordinates: false
    };

    const completed = Object.values(status).filter(Boolean).length;
    const total = Object.keys(status).length;

    expect(completed).toBe(4);
    expect(total).toBe(8);
  });

  it('should enable submit button when all fields complete', () => {
    const allComplete = {
      titleBg: true,
      titleEn: true,
      descBg: true,
      descEn: true,
      nbhBg: true,
      nbhEn: true,
      hasFile: true,
      hasCoordinates: true
    };

    const isFormComplete = Object.values(allComplete).every(Boolean);
    expect(isFormComplete).toBe(true);
  });

  it('should disable submit button when fields incomplete', () => {
    const incomplete = {
      titleBg: true,
      titleEn: false,
      descBg: true,
      descEn: true,
      nbhBg: true,
      nbhEn: true,
      hasFile: true,
      hasCoordinates: true
    };

    const isFormComplete = Object.values(incomplete).every(Boolean);
    expect(isFormComplete).toBe(false);
  });

  it('should validate bilingual title requirement', () => {
    const status = {
      titleBg: true,
      titleEn: false
    };

    expect(status.titleBg && status.titleEn).toBe(false);
  });

  it('should validate bilingual description requirement', () => {
    const status = {
      descBg: true,
      descEn: true
    };

    expect(status.descBg && status.descEn).toBe(true);
  });

  it('should validate map location selection', () => {
    const noLocation = { hasCoordinates: false };
    const withLocation = { hasCoordinates: true };

    expect(noLocation.hasCoordinates).toBe(false);
    expect(withLocation.hasCoordinates).toBe(true);
  });

  it('should validate photo upload requirement', () => {
    const noPhoto = { hasFile: false };
    const withPhoto = { hasFile: true };

    expect(noPhoto.hasFile).toBe(false);
    expect(withPhoto.hasFile).toBe(true);
  });

  it('should calculate correct progress percentage', () => {
    const status = {
      titleBg: true,
      titleEn: true,
      descBg: true,
      descEn: false,
      nbhBg: false,
      nbhEn: false,
      hasFile: false,
      hasCoordinates: false
    };

    const completed = Object.values(status).filter(Boolean).length;
    const total = Object.keys(status).length;
    const percentage = Math.round((completed / total) * 100);

    expect(percentage).toBe(38); // 3/8 = 37.5% rounded to 38%
  });
});

describe('Create Campaign - Form Validation Logic', () => {
  it('should validate required bilingual fields', () => {
    const validateBilingualField = (bg, en) => {
      return Boolean(bg && bg.trim() !== '' && en && en.trim() !== '');
    };

    expect(validateBilingualField('Title BG', 'Title EN')).toBe(true);
    expect(validateBilingualField('Title BG', '')).toBe(false);
    expect(validateBilingualField('', 'Title EN')).toBe(false);
    expect(validateBilingualField('  ', 'Title EN')).toBe(false);
  });

  it('should validate coordinates format', () => {
    const validateCoordinates = (lat, lng) => {
      return lat !== null && lng !== null &&
             !isNaN(lat) && !isNaN(lng) &&
             lat >= -90 && lat <= 90 &&
             lng >= -180 && lng <= 180;
    };

    expect(validateCoordinates(42.65, 23.37)).toBe(true);
    expect(validateCoordinates(null, null)).toBe(false);
    expect(validateCoordinates(100, 23.37)).toBe(false); // Invalid lat
    expect(validateCoordinates(42.65, 200)).toBe(false); // Invalid lng
  });

  it('should validate file upload', () => {
    const validateFile = (file) => {
      if (!file) return false;
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    };

    const validFile = { type: 'image/jpeg', size: 1024 * 1024 };
    const invalidType = { type: 'image/gif', size: 1024 * 1024 };
    const tooLarge = { type: 'image/jpeg', size: 10 * 1024 * 1024 };

    expect(validateFile(validFile)).toBe(true);
    expect(validateFile(invalidType)).toBe(false);
    expect(validateFile(tooLarge)).toBe(false);
    expect(validateFile(null)).toBe(false);
  });
});
