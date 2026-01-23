import { describe, it, expect } from 'vitest';
import * as helpers from '../src/utils/helpers.js';

describe('helpers.js integration', () => {
  it('formats date', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const formatted = helpers.formatDate(date);
    expect(typeof formatted).toBe('string');
    expect(formatted).toMatch(/2024/);
  });

  it('generates random string', () => {
    const str = helpers.randomString(8);
    expect(str).toHaveLength(8);
  });
});
