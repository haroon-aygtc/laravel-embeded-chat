/**
 * API Configuration (Legacy)
 * 
 * This file is maintained for backward compatibility.
 * Please use the centralized API client from '@/services/api/core/apiClient' for all new code.
 */

import {
    API_BASE_URL,
    WS_BASE_URL,
    WS_PORT,
    WS_APP_KEY,
    getWebSocketUrl
} from '@/services/api/core/apiClient';

// Re-export for backwards compatibility
export {
    API_BASE_URL,
    WS_BASE_URL,
    WS_PORT,
    WS_APP_KEY,
    getWebSocketUrl
};

export default {
    API_BASE_URL,
    WS_BASE_URL,
    WS_PORT,
    WS_APP_KEY,
    getWebSocketUrl
}; 