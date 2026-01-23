import { describe, it, expect, vi } from 'vitest';
import * as errorHandler from '../src/services/errorHandler.js';

describe('errorHandler.js integration', () => {
  it('logs and returns error message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = errorHandler.handleError(new Error('fail'));
    expect(result.message).toMatch(/fail/);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns default message for unknown error', () => {
    const result = errorHandler.handleError(null);
    expect(result.message).toMatch(/unknown error/i);
  });
});
