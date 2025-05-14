/**
 * API Middleware
 *
 * This middleware layer handles authentication, validation, and standardization
 * for all API requests. It serves as the central point for all frontend-to-backend
 * communication, eliminating direct database access from the frontend.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from "axios";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { getAuthToken, isTokenExpired, getCsrfToken } from "@/utils/auth";

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

// Request options with additional middleware-specific options
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  mockResponse?: any;
  cacheDuration?: number; // in seconds
  retries?: number; // number of retries for failed requests
  retryDelay?: number; // delay between retries in ms
}

// Cache implementation with size limit and LRU eviction
class LRUCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; lastAccessed: number }
  >();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: any, timestamp: number): void {
    // Evict least recently used item if cache is full
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestAccess = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccessed < oldestAccess) {
          oldestAccess = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { ...value, timestamp, lastAccessed: Date.now() });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (item) {
      // Update last accessed time
      item.lastAccessed = Date.now();
      return item;
    }
    return undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Initialize cache with a reasonable size limit
const cache = new LRUCache(200);

// Generate a cryptographically secure request ID
const generateRequestId = (): string => {
  const randomValues = new Uint32Array(2);
  window.crypto.getRandomValues(randomValues);
  return (
    Date.now().toString(36) +
    "-" +
    randomValues[0].toString(36) +
    "-" +
    randomValues[1].toString(36)
  );
};

// Centralized API configuration
const BASE_URL = env.API_BASE_URL || 'http://localhost:8000/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Create API client instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Required for cookies (CSRF, auth)
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle CSRF token errors
    if (error.response?.status === 419 ||
      (error.response?.status === 403 && error.response?.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string' &&
        error.response.data.message.includes('CSRF'))) {
      try {
        await getCsrfToken();
        // Retry the original request
        if (error.config) {
          return axios(error.config);
        }
      } catch (err) {
        logger.error('Failed to refresh CSRF token:', err);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Redirect to login if not already on login page
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    // Log detailed error info
    logger.error('API Request Failed', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

/**
 * Sleep function for implementing retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Make an API request with standardized handling
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    skipAuth = false,
    mockResponse = null,
    cacheDuration = 0,
    retries = 2, // Default to 2 retries
    retryDelay = 1000, // Default to 1 second delay
    data,
    params,
    ...axiosOptions
  } = options;

  // Generate cache key if caching is enabled
  const cacheKey =
    cacheDuration > 0
      ? `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
      : "";

  // Check cache first if caching is enabled
  if (cacheDuration > 0 && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (
      cachedData &&
      Date.now() - cachedData.timestamp < cacheDuration * 1000
    ) {
      return cachedData.data;
    }
    // Remove expired cache
    cache.delete(cacheKey);
  }

  // Use mock response if in development and mock is provided
  if (env.DEV && mockResponse) {
    const mockData: ApiResponse<T> = {
      success: true,
      data: mockResponse,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };

    // Cache mock response if caching is enabled
    if (cacheDuration > 0) {
      cache.set(cacheKey, { data: mockData }, Date.now());
    }

    return mockData;
  }

  let lastError: any;
  let retryCount = 0;

  // Implement retry logic
  while (retryCount <= retries) {
    try {
      // Make the actual API request
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.request({
        method,
        url,
        data,
        params,
        ...axiosOptions,
        headers: {
          ...axiosOptions.headers,
          // Skip auth header if specified
          ...(skipAuth ? { Authorization: undefined } : {}),
        },
      });

      // Cache successful response if caching is enabled
      if (cacheDuration > 0) {
        cache.set(cacheKey, { data: response.data }, Date.now());
      }

      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry for certain error types
      const status = error.response?.status;
      const shouldRetry =
        // Only retry on network errors or 5xx server errors
        (!status || status >= 500) &&
        // Don't retry on 401 (unauthorized) or 403 (forbidden)
        status !== 401 &&
        status !== 403 &&
        // Only retry if we haven't exceeded max retries
        retryCount < retries;

      if (shouldRetry) {
        retryCount++;
        const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
        logger.warn(
          `Retrying API request (${retryCount}/${retries}) after ${delay}ms: ${method} ${url}`,
        );
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  // Handle the final error after retries
  if (lastError?.response?.data) {
    return lastError.response.data;
  }

  // If no standardized error response is available, create one
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: "ERR_UNKNOWN",
      message: lastError?.message || "An unexpected error occurred",
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };

  logger.error("API Request Error", lastError);
  return errorResponse;
}

// Convenience methods for different HTTP methods
export const api = {
  get: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>("GET", url, options),

  post: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("POST", url, { ...options, data }),

  put: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("PUT", url, { ...options, data }),

  patch: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("PATCH", url, { ...options, data }),

  delete: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>("DELETE", url, options),

  // Clear the entire cache
  clearCache: () => cache.clear(),

  // Clear specific cache entry
  clearCacheFor: (method: string, url: string, params?: any, data?: any) => {
    const cacheKey = `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
    cache.delete(cacheKey);
  },

  // Clear cache entries matching a pattern
  clearCachePattern: (pattern: string) => {
    cache.clearPattern(pattern);
  },

  // Get the base URL for the API
  getBaseUrl: () => apiClient.defaults.baseURL,

  // Direct client access if needed
  client: apiClient
};