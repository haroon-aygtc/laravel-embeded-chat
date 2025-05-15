/**
 * API Middleware
 *
 * This module provides a centralized API client with built-in error handling,
 * request/response formatting, logging, and retry capabilities.
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';
import { getCsrfToken as getAuthCsrfToken } from '@/utils/auth';

// API base URL from environment variables
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

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
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
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
      config.headers['X-Request-ID'] = generateRequestId();

      // For non-GET requests, ensure CSRF token is present
      if (config.method !== 'get') {
        try {
          // Ensure CSRF token is available (will be sent automatically with cookies)
          await getAuthCsrfToken();

          // Extract CSRF token from cookie for headers
          const cookies = document.cookie.split(';');
          const xsrfToken = cookies
            .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

          if (xsrfToken) {
            // Laravel expects the decrypted value, which is provided in the X-XSRF-TOKEN header
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
          }
        } catch (error) {
          logger.error('Failed to get CSRF token for request:', error);
          // Continue without token - the request may fail with 419
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
    (response) => response,
    async (error: AxiosError) => {
      // Handle CSRF token errors
      if (error.response?.status === 419) {
        logger.warn('CSRF token mismatch detected. Refreshing token...');
        try {
          await getAuthCsrfToken();
          // Retry the request with the new CSRF token
          return axios(error.config!);
        } catch (refreshError) {
          logger.error('Failed to refresh CSRF token:', refreshError);
        }
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        logger.warn('Authentication error detected. Redirecting to login page...');

        // Only redirect if not already on an auth page
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
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
      const response = await apiClient.get<T>(endpoint, config);
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