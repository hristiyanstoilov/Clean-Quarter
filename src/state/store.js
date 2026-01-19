/**
 * Centralized State Management Store
 * Handles global application state with pub-sub pattern
 */

class Store {
  constructor() {
    this.state = {
      // Auth State
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Campaigns State
      campaigns: [],
      currentCampaign: null,
      campaignsLoading: false,
      campaignsError: null,

      // User Profile State
      userProfile: null,
      profileLoading: false,
      profileError: null,

      // Rewards State
      rewards: [],
      rewardsLoading: false,
      rewardsError: null,

      // UI State
      currentLanguage: localStorage.getItem('CLEAN_QUARTER_LANGUAGE') || 'bg',
      notifications: [],
      errors: [],

      // Cache
      cache: new Map()
    };

    // Subscribers for state changes
    this.listeners = new Set();
    this.middlewares = [];

    // Initialize
    this.init();
  }

  /**
   * Initialize store
   */
  init() {
    console.log('🏪 Store initialized');
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Called when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Add middleware for state changes
   * @param {Function} middleware - Function to intercept state changes
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state value
   * @param {string} path - Dot-separated path (e.g., 'user.id')
   * @returns {*} State value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  }

  /**
   * Set state (single property or multiple)
   * @param {Object|string} updates - State updates or path
   * @param {*} value - Value if path is string
   */
  setState(updates, value = null) {
    // Run middlewares
    for (const middleware of this.middlewares) {
      updates = middleware(this.state, updates) || updates;
    }

    // Merge updates
    if (typeof updates === 'string') {
      this.setByPath(updates, value);
    } else {
      this.state = { ...this.state, ...updates };
    }

    // Notify listeners
    this.notify();
  }

  /**
   * Set state by path
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setByPath(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this.state;

    for (const key of keys) {
      if (!obj[key]) obj[key] = {};
      obj = obj[key];
    }

    obj[lastKey] = value;
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    console.log('📢 State updated:', this.state);
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('❌ Listener error:', error);
      }
    });
  }

  /**
   * Add notification
   * @param {string} message - Notification message
   * @param {string} type - 'success' | 'error' | 'info' | 'warning'
   * @param {number} duration - Auto-dismiss duration in ms
   */
  addNotification(message, type = 'info', duration = 3000) {
    const id = Date.now();
    const notification = { id, message, type, timestamp: Date.now() };

    this.state.notifications.push(notification);
    // Call the base notify to update listeners (don't recursively call self)
    console.log('📢 State updated:', this.state);
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('❌ Listener error:', error);
      }
    });

    if (duration > 0) {
      setTimeout(() => {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
        this.listeners.forEach(listener => {
          try {
            listener(this.getState());
          } catch (error) {
            console.error('❌ Listener error:', error);
          }
        });
      }, duration);
    }

    return id;
  }

  /**
   * Add error
   * @param {string} error - Error message
   * @param {string} context - Where error occurred
   */
  addError(error, context = 'unknown') {
    this.state.errors.push({
      id: Date.now(),
      error,
      context,
      timestamp: new Date().toISOString()
    });
    this.notify();
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.state.errors = [];
    this.notify();
  }

  /**
   * Cache data
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (0 = never expire)
   */
  setCache(key, value, ttl = 0) {
    this.state.cache.set(key, {
      value,
      expires: ttl > 0 ? Date.now() + ttl * 1000 : null
    });
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCache(key) {
    const cached = this.state.cache.get(key);
    if (!cached) return null;

    if (cached.expires && cached.expires < Date.now()) {
      this.state.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Clear cache
   * @param {string} key - Optional specific key to clear
   */
  clearCache(key = null) {
    if (key) {
      this.state.cache.delete(key);
    } else {
      this.state.cache.clear();
    }
  }

  /**
   * Reset store to initial state
   */
  reset() {
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      campaigns: [],
      currentCampaign: null,
      campaignsLoading: false,
      campaignsError: null,
      userProfile: null,
      profileLoading: false,
      profileError: null,
      rewards: [],
      rewardsLoading: false,
      rewardsError: null,
      currentLanguage: localStorage.getItem('CLEAN_QUARTER_LANGUAGE') || 'bg',
      notifications: [],
      errors: [],
      cache: new Map()
    };
    this.notify();
  }
}

// Export singleton instance
export default new Store();
