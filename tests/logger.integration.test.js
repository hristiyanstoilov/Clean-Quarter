import { describe, it, expect, vi } from 'vitest';
import * as logger from '../src/services/logger.js';

describe('logger.js integration', () => {
  it('logs info', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test info');
    expect(spy).toHaveBeenCalledWith('ℹ️ [INFO] test info', undefined);
    spy.mockRestore();
  });

  it('logs warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warn');
    expect(spy).toHaveBeenCalledWith('⚠️ [WARN] test warn', undefined);
    spy.mockRestore();
  });

  it('logs error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(spy).toHaveBeenCalledWith('❌ [ERROR] test error', undefined, undefined);
    spy.mockRestore();
  });
});
