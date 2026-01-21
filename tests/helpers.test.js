import { describe, it, expect } from 'vitest';
import { capitalize } from '../src/utils/helpers.js';

describe('helpers.js', () => {
  it('capitalize() should capitalize first letter', () => {
    expect(capitalize('test')).toBe('Test');
    expect(capitalize('Тест')).toBe('Тест');
    expect(capitalize('clean')).toBe('Clean');
    expect(capitalize('')).toBe('');
  });
});
