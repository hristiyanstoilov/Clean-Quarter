import * as validation from '../src/services/validation.js';

describe('services/validation.js', () => {
  it('should export validation functions', () => {
    expect(typeof validation.validateField).toBe('function');
    expect(typeof validation.validateForm).toBe('function');
    expect(typeof validation.validateWithSchema).toBe('function');
    expect(typeof validation.addRule).toBe('function');
    expect(typeof validation.addSchema).toBe('function');
    expect(typeof validation.getErrorMessage).toBe('function');
  });

  it('should validate required rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('', ["required"])).toBe("Полето е задължително");
      expect(validateField('ok', ["required"])).toBe(true);
    });

    it('should validate email rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('not-an-email', ["email"])).toBe("Невалиден имейл формат");
      expect(validateField('test@example.com', ["email"])).toBe(true);
    });

    it('should validate number rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('abc', ["number"])).toBe("Трябва да е число");
      expect(validateField('123', ["number"])).toBe(true);
    });

    it('should validate password rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('short', ["password"])).toMatch(/8 символа/);
      expect(validateField('alllowercase1', ["password"])).toMatch(/главна буква/);
      expect(validateField('ALLUPPERCASE1', ["password"])).toMatch(/малка буква/);
      expect(validateField('NoNumber', ["password"])).toMatch(/число/);
      expect(validateField('Valid123A', ["password"])).toBe(true);
    });

    it('should validate url rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('not-a-url', ["url"])).toBe("Invalid URL format");
      expect(validateField('https://example.com', ["url"])).toBe(true);
    });

    it('should validate phone rule', () => {
      const { validateField } = require('../src/services/validation.js');
      expect(validateField('123', ["phone"])).toBe("Invalid phone format");
      expect(validateField('+359888123456', ["phone"])).toBe(true);
    });

    it('should return error for missing schema', () => {
      const { validateWithSchema } = require('../src/services/validation.js');
      expect(validateWithSchema('notfound', {})).toEqual({});
    });

  it('should allow adding custom rule', () => {
    const { addRule, validateField } = require('../src/services/validation.js');
    addRule('alwaysError', () => 'fail');
    expect(validateField('anything', ["alwaysError"])).toBe('fail');
  });
});
