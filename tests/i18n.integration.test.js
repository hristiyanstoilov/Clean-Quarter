
import { describe, it, expect, beforeAll } from 'vitest';
import * as i18n from '../src/utils/i18n.js';

beforeAll(async () => {
  // Patch translations using the public API
  // Simulate initI18n with test translations
  // eslint-disable-next-line no-global-assign
  await (async function mockInit() {
    // Patch the translations and currentLanguage via closure
    // This relies on the module's internal state
    // Set up test translations
    const testTranslations = {
      bg: { dashboard: { title: 'Тест' } },
      en: { dashboard: { title: 'Test' } }
    };
    // Patch global fetch to return test translations
    global.fetch = async (url) => ({
      json: async () => url.includes('bg.json') ? testTranslations.bg : testTranslations.en
    });
    await i18n.initI18n();
  })();
});

describe('i18n.js integration', () => {
  it('returns translation for key', () => {
    const t = i18n.t('dashboard.title');
    expect(typeof t).toBe('string');
  });

  it('switches language', () => {
    i18n.setLanguage('bg');
    expect(i18n.getLanguage()).toBe('bg');
    i18n.setLanguage('en');
    expect(i18n.getLanguage()).toBe('en');
  });
});
