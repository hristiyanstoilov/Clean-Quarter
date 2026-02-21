import loggerInstance from '../src/services/logger.js';
import * as logger from '../src/services/logger.js';

describe('logger.js integration', () => {
  beforeEach(() => {
    loggerInstance.clearLogs();
  });

  it('logs info', () => {
    logger.info('test info');
    const logs = loggerInstance.getLogs('INFO');
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('INFO');
    expect(logs[0].message).toBe('test info');
  });

  it('logs warn', () => {
    logger.warn('test warn');
    const logs = loggerInstance.getLogs('WARN');
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('WARN');
    expect(logs[0].message).toBe('test warn');
  });

  it('logs error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    const logs = loggerInstance.getLogs('ERROR');
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('ERROR');
    expect(logs[0].message).toBe('test error');
    expect(spy).toHaveBeenCalledWith('❌ [ERROR] test error', undefined, undefined);
    spy.mockRestore();
  });
});
