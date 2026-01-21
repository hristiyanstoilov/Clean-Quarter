import { describe, it, expect } from 'vitest';
import * as helpers from '../src/utils/helpers.js';

describe('helpers.js', () => {
  it('capitalize() should capitalize first letter', () => {
    expect(helpers.capitalize('test')).toBe('Test');
    expect(helpers.capitalize('Тест')).toBe('Тест');
    expect(helpers.capitalize('clean')).toBe('Clean');
    expect(helpers.capitalize('')).toBe('');
  });

  it('validateEmail() should validate emails', () => {
    expect(helpers.validateEmail('test@example.com')).toBe(true);
    expect(helpers.validateEmail('invalid-email')).toBe(false);
    expect(helpers.validateEmail('user@domain')).toBe(false);
    expect(helpers.validateEmail('user@domain.bg')).toBe(true);
  });

  it('isEmpty() should check for empty values', () => {
    expect(helpers.isEmpty('')).toBe(true);
    expect(helpers.isEmpty([])).toBe(true);
    expect(helpers.isEmpty({})).toBe(true);
    expect(helpers.isEmpty('not empty')).toBe(false);
    expect(helpers.isEmpty([1,2])).toBe(false);
    expect(helpers.isEmpty({a:1})).toBe(false);
  });

  it('safeStringify() and safeParse() should work correctly', () => {
    const obj = { a: 1, b: 'test' };
    const str = helpers.safeStringify(obj);
    expect(typeof str).toBe('string');
    expect(helpers.safeParse(str)).toEqual(obj);
    expect(helpers.safeParse('invalid json', { fallback: 42 })).toBe(42);
  });

  it('debounce() should delay function execution', async () => {
    let count = 0;
    const fn = helpers.debounce(() => { count++; }, 50);
    fn(); fn(); fn();
    await new Promise(r => setTimeout(r, 100));
    expect(count).toBe(1);
  });

  it('formatValue() should format numbers with symbol', () => {
    expect(helpers.formatValue(1000)).toMatch(/1,000/);
    expect(helpers.formatValue(500, 'лв')).toMatch(/500 лв/);
  });

  it('truncateText() should cut long text', () => {
    expect(helpers.truncateText('short', 10)).toBe('short');
    expect(helpers.truncateText('0123456789abcdef', 10)).toBe('01234567...');
  });

  it('isValidUUID() should validate UUIDs', () => {
    expect(helpers.isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(helpers.isValidUUID('invalid-uuid')).toBe(false);
  });

  it('formatDate() should format dates', () => {
    const d = new Date('2024-01-01T12:00:00Z');
    expect(helpers.formatDate(d)).toMatch(/2024/);
  });

  it('getTimeAgo() should return a string', () => {
    expect(typeof helpers.getTimeAgo(new Date())).toBe('string');
  });

  it('buildUrl() should build URLs', () => {
    expect(helpers.buildUrl('https://test.bg', { a: 1, b: 2 })).toMatch(/a=1/);
  });

  it('getQueryParam() should get params', () => {
    if (typeof window === 'undefined') {
      // Skip test in Node.js
      return;
    }
    window.history.pushState({}, '', '?foo=bar');
    expect(helpers.getQueryParam('foo')).toBe('bar');
  });
});
