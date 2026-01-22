/**
 * Centralized API Client
 * Handles all HTTP requests with interceptors, retry logic, and error handling
 */

import store from "../state/store.js";

class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "https://api.example.com";
    this.timeout = 30000; // 30 seconds
    this.retries = 3;
    this.retryDelay = 1000; // 1 second
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - (config) => config
   */
  useRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - (response) => response
   */
  useResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   * @param {Object} config - Request configuration
   * @returns {Object} Modified configuration
   */
  async executeRequestInterceptors(config) {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = (await interceptor(result)) || result;
    }
    return result;
  }

  /**
   * Execute response interceptors
   * @param {Object} response - Response object
   * @returns {Object} Modified response
   */
  async executeResponseInterceptors(response) {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = (await interceptor(result)) || result;
    }
    return result;
  }

  /**
   * Main request method
   * @param {string} method - HTTP method
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @returns {Promise} Response data
   */
  async request(method, url, data = null, options = {}) {
    store.setState("isLoading", true);

    let config = {
      method,
      url: this.baseURL + url,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : null,
      signal: AbortSignal.timeout(this.timeout),
    };

    // Execute request interceptors
    config = await this.executeRequestInterceptors(config);

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        console.log(`📡 ${method} ${url} (attempt ${attempt + 1}/${this.retries})`);

        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body,
          signal: config.signal,
        });

        // Handle response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            message: errorData.message || `HTTP ${response.status}`,
            data: errorData,
          };
        }

        const responseData = await response.json();

        // Execute response interceptors
        const finalResponse = await this.executeResponseInterceptors({
          status: response.status,
          data: responseData,
          headers: response.headers,
        });

        console.log(`✅ ${method} ${url} - Success`);
        store.setState("isLoading", false);

        return finalResponse.data;
      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.status && error.status >= 400 && error.status < 500) {
          break;
        }

        // Exponential backoff
        if (attempt < this.retries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // Handle final error
    store.setState("isLoading", false);
    console.error(`❌ ${method} ${url} - Failed:`, lastError);
    throw {
      type: "API_ERROR",
      method,
      url,
      error: lastError,
      message: lastError.message || "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request("GET", url, null, options);
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.request("POST", url, data, options);
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request("PUT", url, data, options);
  }

  /**
   * PATCH request
   */
  async patch(url, data, options = {}) {
    return this.request("PATCH", url, data, options);
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request("DELETE", url, null, options);
  }

  /**
   * Sleep utility for delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel ongoing requests
   */
  cancelRequest(signal) {
    signal?.abort();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Add default interceptors
// Request: Add auth token
apiClient.useRequestInterceptor(async (config) => {
  try {
    // This will be integrated with Supabase auth
    // For now, just pass through
  } catch (error) {
    console.error("Auth interceptor error:", error);
  }
  return config;
});

// Response: Handle errors
apiClient.useResponseInterceptor(async (response) => {
  if (response.status >= 400) {
    store.addError(response.data?.message || "API Error", "ApiClient");
  }
  return response;
});

export default apiClient;
