/**
 * Axios Configuration
 * 
 * Configures axios with interceptors for authentication, error handling, and CSRF protection.
 */

import axios from "axios";
import { getCsrfToken } from "@/utils/auth";
import { env } from "@/config/env";
import logger from "@/utils/logger";

// Create axios instance with default config
const api = axios.create({
  baseURL: env.API_BASE_URL || "/api",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  withCredentials: true, // Required for CORS with credentials
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // Add CORS specific headers
  withXSRFToken: true
} as any); // Type assertion to handle custom Axios options

// Response interceptor to handle CORS and authentication
api.interceptors.response.use(
  (response) => {
    // Don't modify successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle CORS preflight requests
    if (error.config && error.config.method?.toLowerCase() === 'options') {
      return Promise.resolve({ status: 200, data: {} });
    }

    // Handle 419 CSRF token mismatch
    if (error.response?.status === 419) {
      try {
        // Try to get a new CSRF token
        await axios.get('/sanctum/csrf-cookie', {
          baseURL: env.API_BASE_URL,
          withCredentials: true
        });
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Handle token expiration or invalid token
      // You might want to redirect to login or refresh the token here
    }

    // Check for network errors
    if (error.code === 'ERR_NETWORK') {
      logger.error('Network error:', error);
    }

    return Promise.reject(error);
  }
);

// Request interceptor for adding CSRF token
api.interceptors.request.use(
  async (config) => {
    // Generate a unique request ID
    const requestId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
    config.headers["X-Request-ID"] = requestId;

    // Skip for CSRF token requests to avoid infinite loops
    if (config.url?.includes('sanctum/csrf-cookie')) {
      return config;
    }

    // For non-GET requests, ensure CSRF token is present
    if (config.method !== 'get') {
      try {
        // Ensure CSRF token is available
        await getCsrfToken();

        // Extract CSRF token from cookie for headers
        const cookies = document.cookie.split(';');
        const xsrfToken = cookies
          .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
          ?.split('=')[1];

        if (xsrfToken) {
          // Laravel expects the decrypted value
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
      } catch (error) {
        logger.error('Failed to get CSRF token for request:', error);
        // Continue without token - the request may fail with 419
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      logger.warn('Authentication error detected');
    }

    // Handle CSRF token errors - but don't auto-refresh
    if (error.response?.status === 419 ||
      (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF'))) {
      logger.warn('CSRF token mismatch detected. Please try again.');
      // Don't automatically refresh token here - let component handle this
    }

    // Log error for debugging
    logger.error('API error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    return Promise.reject(error);
  },
);

// Helper to ensure CSRF token is present before POST/PUT/DELETE requests
export const ensureCsrf = async (): Promise<void> => {
  await getCsrfToken();
};

export default api;
