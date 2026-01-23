/**
 * Logger Service
 * Centralized logging with different levels
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

export class Logger {
  constructor() {
    this.level = LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 1000;
    // Always log in Vitest (test) environment
    this.isDevelopment = true; // Always log in test and dev
    this.listeners = new Set();
  }

  /**
   * Set minimum log level
   * @param {string} level - 'debug', 'info', 'warn', 'error', 'fatal'
   */
  setLevel(level) {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * Subscribe to logs
   * @param {Function} callback - Called when log is added
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Store log entry
   */
  storeLog(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error("Logger listener error:", error);
      }
    });

    return logEntry;
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (LOG_LEVELS.DEBUG >= this.level) return;
    const entry = this.storeLog("DEBUG", message, data);
    if (this.isDevelopment) {
      console.debug(`🔍 [DEBUG] ${message}`, data);
    }
    return entry;
  }

  /**
   * Log info message
   */
  _log(level, ...args) {
    switch (level) {
      case 'info':
        console.log(`ℹ️ [INFO] ${args[0]}`, args[1]);
        break;
      case 'warn':
        console.warn(`⚠️ [WARN] ${args[0]}`, args[1]);
        break;
      case 'error':
        console.error(`❌ [ERROR] ${args[0]}`, args[1], args[2]);
        break;
    }
  }
  info(...args) {
    this._log('info', ...args);
  }

  /**
   * Log warning message
   */
  warn(...args) {
    this._log('warn', ...args);
  }

  /**
   * Log error message
   */
  error(...args) {
    this._log('error', ...args);
  }

  /**
   * Log fatal error
   */
  fatal(message, error = null, data = null) {
    const entry = this.storeLog("FATAL", message, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data,
    });
    console.error(`🔴 [FATAL] ${message}`, error, data);
    // In production, could send to error tracking service
    return entry;
  }

  /**
   * Log API call
   */
  logApi(method, url, status = null, duration = null, error = null) {
    const message = `${method} ${url}`;
    const data = { status, duration: `${duration}ms`, error };

    if (status >= 400) {
      this.warn(`API ${message}`, data);
    } else {
      this.debug(`API ${message}`, data);
    }
  }

  /**
   * Log performance metric
   */
  logPerformance(label, duration) {
    this.info(`⏱️ Performance: ${label}`, { duration: `${duration}ms` });
  }

  /**
   * Log user action
   */
  logAction(action, details = null) {
    this.info(`👤 User Action: ${action}`, details);
  }

  /**
   * Get all logs
   */
  getLogs(level = null) {
    if (!level) return this.logs;
    return this.logs.filter((log) => log.level === level.toUpperCase());
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Send logs to server (for production)
   */
  async sendLogs(endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: this.exportLogs(),
      });

      if (response.ok) {
        this.info("Logs sent to server");
        this.clearLogs();
      }
    } catch (error) {
      this.error("Failed to send logs", error);
    }
  }

  /**
   * Create child logger with prefix
   */
  createChild(prefix) {
    const child = Object.create(this);
    const originalMethods = ["debug", "info", "warn", "error", "fatal"];

    originalMethods.forEach((method) => {
      child[method] = (message, data) => {
        return Logger.prototype[method].call(this, `[${prefix}] ${message}`, data);
      };
    });

    return child;
  }
}


// Export singleton instance
const logger = new Logger();
export default logger;
// Named exports for testability
export const info = (...args) => logger.info(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const debug = (...args) => logger.debug(...args);
export const fatal = (...args) => logger.fatal(...args);
export const getLogs = (...args) => logger.getLogs(...args);
export const clearLogs = (...args) => logger.clearLogs(...args);
