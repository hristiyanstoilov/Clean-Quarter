/**
 * Composition Hooks
 * Reusable logic for data fetching, forms, and UI state
 */

import store from "../state/store.js";
import apiClient from "../api/client.js";
import { validateField } from "../services/validation.js";

/**
 * useAsync - Handle async operations with loading/error states
 * @param {Function} asyncFn - Async function to execute
 * @param {Array} dependencies - Dependency array
 * @returns {Object} { data, loading, error, execute, reset }
 */
export function useAsync(asyncFn, dependencies = []) {
  const state = {
    data: null,
    loading: false,
    error: null,
    execute: async (...args) => {
      state.loading = true;
      state.error = null;
      try {
        state.data = await asyncFn(...args);
        return state.data;
      } catch (error) {
        state.error = error;
        store.addError(error.message || "Async operation failed", "useAsync");
        throw error;
      } finally {
        state.loading = false;
      }
    },
    reset: () => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  };

  return state;
}

/**
 * useFetch - Fetch data from API
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Object} { data, loading, error, refetch, cache }
 */
export function useFetch(url, options = {}) {
  const cacheKey = `fetch_${url}`;
  const cached = store.getCache(cacheKey);

  const state = {
    data: cached || null,
    loading: cached ? false : true,
    error: null,
    url,
    refetch: async () => {
      state.loading = true;
      state.error = null;
      try {
        const result = await apiClient.get(url, options);
        state.data = result;
        store.setCache(cacheKey, result, options.cacheTTL || 300); // 5 min default
        return result;
      } catch (error) {
        state.error = error;
        store.addError(error.message, "useFetch");
        throw error;
      } finally {
        state.loading = false;
      }
    },
    cache: {
      clear: () => store.clearCache(cacheKey),
      set: (value, ttl) => store.setCache(cacheKey, value, ttl),
    },
  };

  // Auto-fetch if not cached
  if (!cached) {
    state.refetch().catch((err) => {
      console.error("Auto-fetch error:", err);
    });
  }

  return state;
}

/**
 * useForm - Handle form state and validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} schema - Validation schema
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and methods
 */
export function useForm(initialValues = {}, schema = {}, onSubmit = null) {
  const state = {
    values: { ...initialValues },
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,

    setValue: (field, value) => {
      state.values[field] = value;
      state.isDirty = true;
      // Auto-validate on change
      if (schema[field]) {
        const error = validateField(value, schema[field]);
        state.errors[field] = error;
      }
    },

    setError: (field, error) => {
      state.errors[field] = error;
    },

    setTouched: (field, touched = true) => {
      state.touched[field] = touched;
    },

    resetForm: () => {
      state.values = { ...initialValues };
      state.errors = {};
      state.touched = {};
      state.isSubmitting = false;
      state.isDirty = false;
    },

    getFieldProps: (field) => {
      return {
        value: state.values[field] || "",
        onChange: (e) => state.setValue(field, e.target.value),
        onBlur: () => state.setTouched(field, true),
        error: state.touched[field] ? state.errors[field] : null,
      };
    },

    getErrors: () => {
      return state.errors;
    },

    isValid: () => {
      return Object.values(state.errors).every((error) => !error);
    },

    submit: async (e) => {
      if (e?.preventDefault) e.preventDefault();

      // Validate all fields
      const newErrors = {};
      for (const [field, rules] of Object.entries(schema)) {
        const error = validateField(state.values[field], rules);
        if (error) newErrors[field] = error;
      }

      state.errors = newErrors;

      if (Object.keys(newErrors).length > 0) {
        store.notify("Please fix errors before submitting", "error");
        return false;
      }

      state.isSubmitting = true;
      try {
        if (onSubmit) {
          await onSubmit(state.values);
        }
        store.notify("Form submitted successfully", "success");
        return true;
      } catch (error) {
        store.addError(error.message || "Form submission failed", "useForm");
        return false;
      } finally {
        state.isSubmitting = false;
      }
    },
  };

  return state;
}

/**
 * useState - Simple state management
 * @param {*} initialValue - Initial state value
 * @returns {Array} [value, setValue]
 */
export function useState(initialValue) {
  let value = initialValue;

  const listeners = new Set();

  const dispatch = (newValue) => {
    if (typeof newValue === "function") {
      value = newValue(value);
    } else {
      value = newValue;
    }
    listeners.forEach((listener) => listener(value));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return [value, dispatch, subscribe];
}

/**
 * useStoreState - Connect component to global store
 * @param {string} path - Dot-separated path to store value
 * @returns {Array} [value, setValue]
 */
export function useStoreState(path) {
  const value = store.get(path);

  const setValue = (newValue) => {
    if (typeof newValue === "function") {
      store.setState(path, newValue(value));
    } else {
      store.setState(path, newValue);
    }
  };

  return [value, setValue];
}

/**
 * useEffect - Subscribe to changes (simple version)
 * @param {Function} callback - Function to call when dependencies change
 * @param {Function|Array} dependencies - Can be function or array
 */
export function useEffect(callback, dependencies = []) {
  if (typeof dependencies === "function") {
    // Simple immediate execution
    dependencies();
    callback();
  } else if (Array.isArray(dependencies)) {
    // For store subscriptions
    const unsubscribe = store.subscribe(() => {
      callback();
    });
    return unsubscribe;
  }
}

/**
 * useDebounce - Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced function
 */
export function useDebounce(fn, delay = 300) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * useThrottle - Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} Throttled function
 */
export function useThrottle(fn, delay = 300) {
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
