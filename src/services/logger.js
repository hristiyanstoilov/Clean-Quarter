/**
 * Logger Service
 * Centralized logging with different levels
 */

import { isBrowser, hasLocalStorage, hasNavigator } from "../utils/env.js";

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.level = LOG_LEVELS.DEBUG;
    this.isDevelopment = true;
    this.listeners = new Set();
  }

  /**
   * Store log entry
   */
  storeLog(level, message, data = null, _skipListenerNotify = false) {
    const userAgent =
      typeof navigator !== "undefined" && navigator && navigator.userAgent
        ? navigator.userAgent
        : null;
    const url =
      typeof window !== "undefined" && window && window.location && window.location.href
        ? window.location.href
        : null;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent,
      url,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners, unless skipping due to error handling
    if (!_skipListenerNotify) {
      this.listeners.forEach((listener) => {
        try {
          listener(logEntry);
        } catch (error) {
          // Prevent recursion by skipping listener notification
          this.storeLog("ERROR", "Logger listener error:", error, true);
        }
      });
    }

    if (hasLocalStorage()) {
      const logs = JSON.parse(window.localStorage.getItem("logs") || "[]");
      logs.push(logEntry);
      window.localStorage.setItem("logs", JSON.stringify(logs));
    }

    return logEntry;
  }

  /**
   * Subscribe to log events
   * @param {Function} callback - Called when log is added
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (this.level > LOG_LEVELS.DEBUG) return;
    const entry = this.storeLog("DEBUG", message, data);
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
    return entry;
  }

  /**
   * Log info message
   */
  info(...args) {
    this._log("info", ...args);
  }

  /**
   * Log warning message
   */
  warn(...args) {
    this._log("warn", ...args);
  }

  /**
   * Log error message
   */
  error(...args) {
    this._log("error", ...args);
  }

  /**
   * Log fatal error
   */
  fatal(message, data = null) {
    this.storeLog("FATAL", message, data);
    if (typeof console !== "undefined" && console.error) {
      console.error(`💀 [FATAL] ${message}`, data);
    }
  }

  /**
   * Internal logging method
   */
  _log(level, ...args) {
    switch (level) {
      case "info": {
        this.storeLog("INFO", args[0], args[1]);
        if (typeof console !== "undefined" && console.log) {
          const msg = typeof args[0] === "string" ? `ℹ️ [INFO] ${args[0]}` : "ℹ️ [INFO]";
          console.log(msg, args[1]);
        }
        break;
      }
      case "warn": {
        this.storeLog("WARN", args[0], args[1]);
        if (typeof console !== "undefined" && console.warn) {
          const msg = typeof args[0] === "string" ? `⚠️ [WARN] ${args[0]}` : "⚠️ [WARN]";
          console.warn(msg, args[1]);
        }
        break;
      }
      case "error": {
        this.storeLog("ERROR", args[0], args[1]);
        if (typeof console !== "undefined" && console.error) {
          const msg = typeof args[0] === "string" ? `❌ [ERROR] ${args[0]}` : "❌ [ERROR]";
          console.error(msg, args[1], args[2]);
        }
        break;
      }
    }
  }

  /**
   * Log API message
   */
  logAPI(message, data = null, isError = false) {
    if (isError) {
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
      child[method] = function (message, data) {
        // Call via child instance so spies work
        return this.__proto__[method].call(this, `[${prefix}] ${message}`, data);
      };
    });

    return child;
  }
}

// Export singleton instance
export { Logger, Logger as LoggerClass };
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
