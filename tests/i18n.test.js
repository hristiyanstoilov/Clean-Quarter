import { describe, it, expect } from 'vitest';
import * as i18n from '../src/utils/i18n.js';

describe('i18n.js', () => {
  it('should export functions', () => {
    expect(typeof i18n.initI18n).toBe('function');
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.setLanguage).toBe('function');
    expect(typeof i18n.getCurrentLanguage).toBe('function');
    expect(typeof i18n.applyLanguage).toBe('function');
    expect(typeof i18n.getAvailableLanguages).toBe('function');
  });

  it('t() should return key if not found', () => {
    expect(i18n.t('nonexistent_key', 'en')).toBe('nonexistent_key');
  });
});
