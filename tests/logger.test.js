import { describe, it, expect, vi } from 'vitest';
import logger, { Logger as LoggerClass, getLogs, clearLogs } from '../src/services/logger.js';

describe('services/logger.js', () => {
  it('should create a Logger instance', () => {
    expect(typeof LoggerClass).toBe('function');
    expect(logger).toBeInstanceOf(LoggerClass);
  });

  it('should store logs and respect maxLogs limit', () => {
    logger.clearLogs();
    logger.maxLogs = 5;
    for (let i = 0; i < 10; i++) {
      logger.storeLog('INFO', `msg${i}`);
    }
    expect(logger.logs.length).toBe(5);
    expect(logger.logs[0].message).toBe('msg5');
  });

  it('should handle missing window/navigator gracefully', () => {
    const origWindow = global.window;
    const origNavigator = global.navigator;
    delete global.window;
    delete global.navigator;
    expect(() => logger.storeLog('INFO', 'no window')).not.toThrow();
    global.window = origWindow;
    global.navigator = origNavigator;
  });

  it('should notify listeners and handle listener errors', () => {
    let called = false;
    logger.subscribe(() => { called = true; });
    logger.subscribe(() => { throw new Error('fail'); });
    expect(() => logger.storeLog('INFO', 'listener test')).not.toThrow();
    expect(called).toBe(true);
  });

  it('should clear logs', () => {
    logger.storeLog('INFO', 'to clear');
    expect(logger.logs.length).toBeGreaterThan(0);
    logger.clearLogs();
    expect(logger.logs.length).toBe(0);
  });

  it('should export logs as JSON', () => {
    logger.storeLog('INFO', 'json');
    const json = logger.exportLogs();
    expect(typeof json).toBe('string');
    expect(json).toMatch(/json/);
    logger.clearLogs();
  });

  it('should create a child logger with prefix', () => {
    const child = logger.createChild('TEST');
    const spy = vi.spyOn(logger, 'info');
    child.info('child message');
    expect(spy).toHaveBeenCalledWith('[TEST] child message', undefined);
    spy.mockRestore();
  });
});
