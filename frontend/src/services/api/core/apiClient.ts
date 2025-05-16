import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getCsrfToken } from '@/utils/auth';
import logger from '@/utils/logger';

/**
 * Core API client for the application
 * Handles authentication, request/response processing, and error handling
 */

// API Base URL - default to relative path if not defined in env
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// WebSocket Configuration
export const WS_BASE_URL = import.meta.env.VITE_WEBSOCKET_URL ||
    (window.location.protocol === 'https:' ?
        'wss://' + window.location.host :
        'ws://' + window.location.host);

export const WS_PORT = import.meta.env.VITE_WEBSOCKET_PORT || '3000';
export const WS_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'laravel-chat-key';

// WebSocket Helper Functions
export const getWebSocketUrl = (path: string = '', params: Record<string, string> = {}) => {
    // Construct base URL
    let url = `${WS_BASE_URL}:${WS_PORT}/app/${WS_APP_KEY}${path}`;

    // Add query params if any
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
        url = `${url}?${queryParams}`;
    }

    return url;
};

// Function to generate a unique ID for each request
const generateRequestId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create axios instance with base URL and sensible defaults
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 seconds
    withCredentials: true, // Include cookies in cross-origin requests if needed
});

// Add request interceptor for authentication and security
apiClient.interceptors.request.use(
    async (config) => {
        // Add request ID for tracing
        const requestId = generateRequestId();
        config.headers['X-Request-ID'] = requestId;

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
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
    },
);

// Add response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
            // Don't automatically redirect - let the components handle auth redirects
            // This prevents conflicts with the login/register flows
            logger.warn('Authentication error detected');
        }

        // Log all errors
        logger.error('API Request Error', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
        });

        return Promise.reject(error);
    }
);

// API response interface to standardize responses
export interface ApiResponse<T = any> {
    data?: T;
    success: boolean;
    status: string;
    message?: string;
    error?: {
        code?: string;
        message?: string;
        details?: any;
    };
}

// API wrapper functions
export const api = {
    // Standard REST methods
    get: async <T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await apiClient.get<T>(url, { ...config, params });
        return response.data;
    },

    post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await apiClient.post<T>(url, data, config);
        return response.data;
    },

    put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await apiClient.put<T>(url, data, config);
        return response.data;
    },

    patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await apiClient.patch<T>(url, data, config);
        return response.data;
    },

    delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await apiClient.delete<T>(url, config);
        return response.data;
    },

    // Get the raw axios instance for more complex scenarios
    client: apiClient,

    /**
     * Stream data from a server-sent events (SSE) endpoint
     */
    stream: <T = any>(
        endpoint: string,
        data: any,
        callbacks: {
            onStart?: (data: any) => void,
            onChunk: (chunk: any) => void,
            onComplete?: (data: any) => void,
            onError?: (error: any) => void,
        }
    ): () => void => {
        // Create the full URL
        const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);

        // Create headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
        };

        // Add auth token if available (try all storage mechanisms for compatibility)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Create AbortController to allow cancellation
        const controller = new AbortController();
        const { signal } = controller;

        // Start the fetch
        fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            credentials: 'include',
            signal,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                if (!response.body) {
                    throw new Error('ReadableStream not supported in this browser.');
                }

                // Get the reader from the response body stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                // Read the stream
                const processStream = ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
                    // Stream is done
                    if (done) {
                        return Promise.resolve();
                    }

                    // Decode the stream chunk
                    const chunk = decoder.decode(value, { stream: true });

                    // Process each SSE event
                    const events = chunk.split('\n\n').filter(Boolean);

                    events.forEach(event => {
                        const eventTypeMatch = event.match(/^event: (.+)$/m);
                        const dataMatch = event.match(/^data: (.+)$/m);

                        if (eventTypeMatch && dataMatch) {
                            const eventType = eventTypeMatch[1];
                            const data = JSON.parse(dataMatch[1]);

                            switch (eventType) {
                                case 'start':
                                    callbacks.onStart?.(data);
                                    break;
                                case 'chunk':
                                    callbacks.onChunk(data);
                                    break;
                                case 'done':
                                    callbacks.onComplete?.(data);
                                    break;
                                case 'error':
                                    callbacks.onError?.(data);
                                    break;
                            }
                        }
                    });

                    // Continue reading the stream
                    return reader.read().then(processStream);
                };

                // Start processing the stream
                reader.read().then(processStream);
            })
            .catch(error => {
                callbacks.onError?.(error);
            });

        // Return a function to cancel the stream
        return () => controller.abort();
    }
};

export default api; 