/**
 * API Middleware
 *
 * This module provides a centralized API client with built-in error handling,
 * request/response formatting, logging, and retry capabilities.
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';
import { getCsrfToken as getAuthCsrfToken } from '@/utils/auth';
import { env } from '@/config/env';
import Cookies from 'js-cookie';

// Extended request config to include our custom properties
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipDuplicateProtection?: boolean;
  _pendingRequestCleanup?: () => void;
}

// API base URL from environment variables with fallback
const BASE_URL = env.API_BASE_URL || 'http://localhost:9000/api';
logger.debug(`API Middleware initialized with BASE_URL: ${BASE_URL}`);
const API_TIMEOUT = 30000; // 30 seconds

// Track in-flight requests to prevent duplicates
const pendingRequests = new Map();

// Generate a request key based on method and URL
const getRequestKey = (config) => {
  return `${config.method}:${config.url}${JSON.stringify(config.params || {})}`;
};

// Cancel any pending duplicate requests
const cancelPendingRequests = (config) => {
  const requestKey = getRequestKey(config);
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    logger.debug(`Canceling duplicate request: ${requestKey}`);
    controller.abort();
    pendingRequests.delete(requestKey);
  }
};

/**
 * Request configuration options
 */
export interface ApiRequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  [key: string]: any;
}

/**
 * API error interface
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    status: number;
    message: string;
    details?: Record<string, string[]>;
  } | null;
  loading?: boolean;
}

/**
 * Generate a unique request ID
 */
const generateRequestId = (): string => {
  return uuidv4();
};

/**
 * Handle successful API responses
 */
const handleSuccess = <T>(response: AxiosResponse<any>): ApiResponse<T> => {
  // Handle Laravel API responses which may already have a success field
  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    return response.data as ApiResponse<T>;
  }

  // Otherwise, format the response
  return {
    success: true,
    data: response.data,
    error: null
  };
};

/**
 * Handle API errors
 */
const handleError = <T>(error: any): ApiResponse<T> => {
  let errorResponse: ApiError = {
    message: 'An unknown error occurred'
  };

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Extract error message from response if available
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data;

      // Handle Laravel error responses
      if (typeof responseData === 'object') {
        if ('message' in responseData) {
          errorResponse.message = responseData.message as string;
        }

        if ('errors' in responseData) {
          errorResponse.details = responseData.errors;
        }
      } else if (typeof responseData === 'string') {
        errorResponse.message = responseData;
      }
    } else if (axiosError.message) {
      // Use axios error message as fallback
      errorResponse.message = axiosError.message;
    }

    // Include HTTP status info if available
    if (axiosError.response) {
      errorResponse.status = axiosError.response.status;
      errorResponse.code = `HTTP_${axiosError.response.status}`;
    } else if (axiosError.code) {
      // Handle network errors
      errorResponse.code = axiosError.code;
    }
  } else if (error instanceof Error) {
    errorResponse.message = error.message;
  }

  // Log the error
  logger.error('API Error:', errorResponse);

  return {
    success: false,
    data: null,
    error: {
      status: errorResponse.status || 500,
      message: errorResponse.message,
      details: errorResponse.details
    }
  };
};

/**
 * Get CSRF token from the server
 */
const getCsrfToken = async (): Promise<void> => {
  try {
    logger.debug('Fetching CSRF token...');

    // Get the correct base URL from environment
    const baseUrl = env.API_BASE_URL || 'http://localhost:9000/api';
    // Remove /api from the end if present to get the correct sanctum endpoint
    const sanctumUrl = baseUrl.replace(/\/api\/?$/, '') + '/sanctum/csrf-cookie';

    logger.debug(`Making CSRF request to: ${sanctumUrl}`);

    const response = await axios.get(sanctumUrl, {
      withCredentials: true
    });

    // Add a small delay to ensure cookies are properly set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the CSRF token was set in cookies
    const cookies = document.cookie.split(';');
    const xsrfToken = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));

    if (xsrfToken) {
      logger.debug('CSRF token fetch successful');
    } else {
      logger.warn('CSRF token request successful but token not found in cookies');
    }
  } catch (error) {
    logger.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

/**
 * Creates and configures an axios instance with interceptors
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: API_TIMEOUT,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  // Request interceptor
  instance.interceptors.request.use(
    async (config) => {
      // Add request ID for tracking
      const requestId = uuidv4();
      config.headers['X-Request-ID'] = requestId;

      // Set content type if not specified
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      // Add auth token to headers if available
      const authToken = localStorage.getItem('access_token');
      if (authToken && !config.headers['Authorization']) {
        config.headers['Authorization'] = authToken;
        logger.debug(`Added auth token to request ${requestId}`);
      }

      // Check for CSRF token for requests that need it
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        try {
          // Try to get the CSRF token from cookies
          const csrfToken = Cookies.get('XSRF-TOKEN');
          if (csrfToken) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
          } else {
            // If not found in cookies, try to get a new one
            await getAuthCsrfToken();
            const newCsrfToken = Cookies.get('XSRF-TOKEN');
            if (newCsrfToken) {
              config.headers['X-XSRF-TOKEN'] = decodeURIComponent(newCsrfToken);
            }
          }
        } catch (error) {
          logger.error('Failed to get CSRF token for request:', error);
        }
      }

      // For HTTP methods that should be unique, create an AbortController and 
      // cancel any duplicate in-flight requests (GET, HEAD, OPTIONS)
      if (['get', 'head', 'options'].includes(config.method?.toLowerCase() || '')) {
        // Skip duplicate protection for specific operations like polling 
        const skipDuplicateProtection = (config as ExtendedAxiosRequestConfig).skipDuplicateProtection === true;

        if (!skipDuplicateProtection) {
          // Set up a new AbortController for this request
          const controller = new AbortController();
          config.signal = controller.signal;

          // Cancel any duplicate requests already in flight
          cancelPendingRequests(config);

          // Store this request's controller
          const requestKey = getRequestKey(config);
          pendingRequests.set(requestKey, controller);

          // Remove from tracking when the request completes (in either interceptor)
          const removeFromTracking = () => {
            pendingRequests.delete(requestKey);
          };

          // Attach cleanup to the config for use in response interceptor
          (config as ExtendedAxiosRequestConfig)._pendingRequestCleanup = removeFromTracking;
        }
      }

      return config;
    },
    (error) => {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Clean up pending request tracking if this was a tracked request
      if (response.config && typeof (response.config as ExtendedAxiosRequestConfig)._pendingRequestCleanup === 'function') {
        (response.config as ExtendedAxiosRequestConfig)._pendingRequestCleanup?.();
      }
      return response;
    },
    async (error: AxiosError) => {
      // Clean up pending request tracking even on error
      if (error.config && typeof (error.config as ExtendedAxiosRequestConfig)._pendingRequestCleanup === 'function') {
        (error.config as ExtendedAxiosRequestConfig)._pendingRequestCleanup?.();
      }

      // Handle CSRF token errors
      if (error.response?.status === 419 ||
        (error.response?.status === 403 &&
          typeof error.response?.data === 'object' &&
          error.response?.data !== null &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string' &&
          error.response.data.message.includes('CSRF'))) {
        logger.warn('CSRF token mismatch detected. Refreshing token and retrying request...');
        console.log('API Middleware: CSRF token mismatch detected, refreshing token...', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data
        });

        try {
          // Force a new token fetch by clearing any existing token tracking
          document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          // Wait a moment before requesting a new token
          await new Promise(resolve => setTimeout(resolve, 500));

          // Get a fresh token with our enhanced function
          await getAuthCsrfToken();

          // Wait longer for cookie to be properly set
          await new Promise(resolve => setTimeout(resolve, 500));

          // Get the new token from cookies
          const cookies = document.cookie.split(';');
          const xsrfToken = cookies
            .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

          if (!xsrfToken) {
            logger.error('Could not find XSRF token after refresh, giving up');
            console.error('API Middleware: Could not find XSRF token after refresh, giving up');
            return Promise.reject(error);
          }

          // Add the new token to the request headers
          if (error.config && error.config.headers) {
            error.config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
            console.log('API Middleware: Added refreshed CSRF token to headers, retrying request');
          }

          // Retry the request with the new CSRF token
          logger.info('Retrying request with new CSRF token');
          return axios(error.config!);
        } catch (refreshError) {
          logger.error('Failed to refresh CSRF token:', refreshError);
          console.error('API Middleware: Failed to refresh CSRF token:', refreshError);
          return Promise.reject(error);
        }
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        logger.warn('Authentication error detected');
        console.log('API Middleware: Authentication error detected', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data
        });

        // Check if this is a login or token refresh request
        const isAuthRequest = error.config?.url &&
          ['/login', '/auth/login', '/token/refresh', '/auth/token', '/auth/refresh'].some(endpoint =>
            error.config?.url?.includes(endpoint));

        // Also check if this is a profile request which might fail during normal navigation
        const isProfileRequest = error.config?.url &&
          ['/profile', '/me', '/auth/me', '/user/profile'].some(endpoint =>
            error.config?.url?.includes(endpoint));

        // Only clear auth state for non-auth requests and non-profile requests
        // This prevents clearing auth during login attempts or normal navigation
        if (!isAuthRequest && !isProfileRequest) {
          console.log('API Middleware: Clearing auth state due to 401 on protected endpoint');
          // Import at runtime to avoid circular dependencies
          const { AuthService } = require('@/services/authService');

          const authService = AuthService.getInstance();
          authService.clearAuth();

          // We don't automatically redirect here - let the components handle redirects
          // This prevents conflicts with the login/register flows
        } else {
          console.log('API Middleware: Not clearing auth state for auth/profile request');
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create the API client
const apiClient = createApiClient();

/**
 * API client for making HTTP requests
 */
export const api = {
  /**
   * Make a GET request
   */
  get: async <T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> => {
    try {
      // Special handling for profile endpoint to prevent duplicate requests
      if (endpoint === '/profile' || endpoint.endsWith('/profile') || endpoint.includes('/profile')) {
        // Check if we've already made a request to this endpoint in last 5 seconds
        const now = Date.now();
        const lastProfileRequestTime = parseInt(sessionStorage.getItem('last_profile_request_time') || '0', 10);

        if (now - lastProfileRequestTime < 5000) { // 5 seconds
          logger.debug('Profile endpoint called too frequently, returning cached response');

          // Try to use cached response
          const cachedResponse = sessionStorage.getItem('profile_response');
          if (cachedResponse) {
            return JSON.parse(cachedResponse) as ApiResponse<T>;
          }
        }

        // Update timestamp
        sessionStorage.setItem('last_profile_request_time', now.toString());
      }

      const response = await apiClient.get<T>(endpoint, config);

      // Cache profile response
      if ((endpoint === '/profile' || endpoint.endsWith('/profile') || endpoint.includes('/profile')) && response.status === 200) {
        const responseToCache: ApiResponse<T> = handleSuccess(response);
        try {
          sessionStorage.setItem('profile_response', JSON.stringify(responseToCache));
        } catch (e) {
          // Ignore storage errors
        }
      }

      return handleSuccess(response);
    } catch (error) {
      return handleError<T>(error);
    }
  },

  /**
   * Make a POST request
   */
  post: async <T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<T>(endpoint, data, config);
      return handleSuccess(response);
    } catch (error) {
      return handleError<T>(error);
    }
  },

  /**
   * Make a PUT request
   */
  put: async <T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<T>(endpoint, data, config);
      return handleSuccess(response);
    } catch (error) {
      return handleError<T>(error);
    }
  },

  /**
   * Make a DELETE request
   */
  delete: async <T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<T>(endpoint, config);
      return handleSuccess(response);
    } catch (error) {
      return handleError<T>(error);
    }
  },

  /**
   * Make a PATCH request
   */
  patch: async <T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.patch<T>(endpoint, data, config);
      return handleSuccess(response);
    } catch (error) {
      return handleError<T>(error);
    }
  },

  /**
   * Access to the raw axios instance
   */
  client: apiClient
};