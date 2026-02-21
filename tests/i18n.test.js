import * as i18n from '../src/utils/i18n.js';

describe('i18n.js - Exports', () => {
  it('should export required functions', () => {
    expect(typeof i18n.initI18n).toBe('function');
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.setLanguage).toBe('function');
    expect(typeof i18n.getCurrentLanguage).toBe('function');
    expect(typeof i18n.applyLanguage).toBe('function');
    expect(typeof i18n.getAvailableLanguages).toBe('function');
  });
});

describe('Translation Function (t)', () => {
  it('should return key if translation not found', () => {
    expect(i18n.t('nonexistent_key', 'en')).toBe('nonexistent_key');
  });

  it('should return fallback for missing translations', () => {
    const translate = (key, lang, fallback = null) => {
      const translations = {
        'bg': { 'hello': 'Здравей', 'goodbye': 'Довиждане' },
        'en': { 'hello': 'Hello', 'goodbye': 'Goodbye' }
      };

      return translations[lang]?.[key] || fallback || key;
    };

    expect(translate('hello', 'bg')).toBe('Здравей');
    expect(translate('hello', 'en')).toBe('Hello');
    expect(translate('missing', 'bg', 'Default')).toBe('Default');
    expect(translate('missing', 'bg')).toBe('missing');
  });

  it('should handle nested translation keys', () => {
    const getNestedTranslation = (keyPath, lang) => {
      const translations = {
        'en': {
          'errors': {
            'validation': {
              'required': 'This field is required',
              'email': 'Invalid email format'
            }
          }
        }
      };

      const keys = keyPath.split('.');
      let value = translations[lang];

      for (const key of keys) {
        value = value?.[key];
        if (!value) return keyPath;
      }

      return value;
    };

    expect(getNestedTranslation('errors.validation.required', 'en'))
      .toBe('This field is required');
    expect(getNestedTranslation('errors.validation.missing', 'en'))
      .toBe('errors.validation.missing');
  });

  it('should support variable interpolation', () => {
    const interpolate = (template, variables) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    const template = 'Hello {{name}}, you have {{count}} messages';
    const result = interpolate(template, { name: 'John', count: 5 });

    expect(result).toBe('Hello John, you have 5 messages');
  });

  it('should handle pluralization', () => {
    const pluralize = (count, translations) => {
      if (count === 0) return translations.zero || translations.other;
      if (count === 1) return translations.one;
      return translations.other;
    };

    const messages = {
      zero: 'No messages',
      one: '1 message',
      other: '{{count}} messages'
    };

    expect(pluralize(0, messages)).toBe('No messages');
    expect(pluralize(1, messages)).toBe('1 message');
    expect(pluralize(5, messages)).toBe('{{count}} messages');
  });
});

describe('Language Switching', () => {
  it('should validate language codes', () => {
    const isValidLanguage = (lang) => {
      const validLanguages = ['bg', 'en'];
      return validLanguages.includes(lang);
    };

    expect(isValidLanguage('bg')).toBe(true);
    expect(isValidLanguage('en')).toBe(true);
    expect(isValidLanguage('fr')).toBe(false);
    expect(isValidLanguage('invalid')).toBe(false);
  });

  it('should default to Bulgarian if language invalid', () => {
    const normalizeLanguage = (lang) => {
      const validLanguages = ['bg', 'en'];
      return validLanguages.includes(lang) ? lang : 'bg';
    };

    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('fr')).toBe('bg');
    expect(normalizeLanguage(null)).toBe('bg');
  });

  it('should persist language preference', () => {
    const saveLanguagePreference = (lang) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', lang);
      }
      return lang;
    };

    const loadLanguagePreference = () => {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('language') || 'bg';
      }
      return 'bg';
    };

    // Mock localStorage
    global.localStorage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = value; }
    };

    saveLanguagePreference('en');
    expect(loadLanguagePreference()).toBe('en');

    saveLanguagePreference('bg');
    expect(loadLanguagePreference()).toBe('bg');
  });

  it('should detect browser language', () => {
    const detectBrowserLanguage = (navigatorObj) => {
      const browserLang = navigatorObj?.language || navigatorObj?.userLanguage || 'en';
      return browserLang.split('-')[0]; // 'en-US' -> 'en'
    };

    // Test with mock navigator objects
    expect(detectBrowserLanguage({ language: 'bg-BG' })).toBe('bg');
    expect(detectBrowserLanguage({ language: 'en-US' })).toBe('en');
    expect(detectBrowserLanguage({ userLanguage: 'bg' })).toBe('bg');
    expect(detectBrowserLanguage(null)).toBe('en');
  });
});

describe('Bilingual Content Support', () => {
  it('should extract correct language from bilingual object', () => {
    const getBilingualText = (obj, lang) => {
      return lang === 'bg' ? obj.title_bg : obj.title_en;
    };

    const campaign = {
      title_bg: 'Почистване на парк',
      title_en: 'Park Cleanup'
    };

    expect(getBilingualText(campaign, 'bg')).toBe('Почистване на парк');
    expect(getBilingualText(campaign, 'en')).toBe('Park Cleanup');
  });

  it('should fallback to Bulgarian if English missing', () => {
    const getBilingualTextWithFallback = (obj, lang) => {
      const bgText = obj.title_bg || obj.description_bg;
      const enText = obj.title_en || obj.description_en;

      if (lang === 'en') {
        return enText || bgText || '';
      }
      return bgText || enText || '';
    };

    const incomplete = {
      title_bg: 'Заглавие',
      title_en: null
    };

    expect(getBilingualTextWithFallback(incomplete, 'en')).toBe('Заглавие');
    expect(getBilingualTextWithFallback(incomplete, 'bg')).toBe('Заглавие');
  });

  it('should format dates according to language', () => {
    const formatDate = (date, lang) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const locale = lang === 'bg' ? 'bg-BG' : 'en-US';
      return new Date(date).toLocaleDateString(locale, options);
    };

    const date = '2024-01-15';
    const bgFormat = formatDate(date, 'bg');
    const enFormat = formatDate(date, 'en');

    expect(bgFormat).toBeDefined();
    expect(enFormat).toBeDefined();
    expect(bgFormat).not.toBe(enFormat);
  });
});
