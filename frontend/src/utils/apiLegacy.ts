/**
 * DEPRECATED - DO NOT USE FOR NEW CODE
 * 
 * Legacy API Compatibility Layer
 * 
 * This file provides backward compatibility for code that uses the old API patterns.
 * It redirects all calls to the modern API implementations.
 * 
 * DEPRECATION NOTICE: This file is for transition purposes only and should be removed.
 * Please update your code to use the modern API implementations:
 * - For auth: import { authApi } from '@/services/api/features/auth'
 * - For general API: import { api } from '@/services/api/middleware/apiMiddleware'
 */

import { api } from '@/services/api/middleware/apiMiddleware';
import { authApi as modernAuthApi } from '@/services/api/features/auth';
import logger from '@/utils/logger';

// Legacy auth API - redirects to the new implementation
export const authApi = {
    login: async (email: string, password: string) => {
        logger.warn('DEPRECATED: authApi.login is deprecated. Use import { authApi } from "@/services/api/features/auth" instead.');
        try {
            // Use the modern implementation internally
            const result = await modernAuthApi.login({ email, password });
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error };
        }
    },

    register: async (name: string, email: string, password: string) => {
        logger.warn('DEPRECATED: authApi.register is deprecated. Use import { authApi } from "@/services/api/features/auth" instead.');
        try {
            const result = await modernAuthApi.register({ name, email, password });
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error };
        }
    },

    getProfile: async (token: string) => {
        logger.warn('DEPRECATED: authApi.getProfile is deprecated. Use import { authApi } from "@/services/api/features/auth" instead.');
        try {
            const result = await modernAuthApi.getCurrentUser();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error };
        }
    },

    logout: async (token: string) => {
        logger.warn('DEPRECATED: authApi.logout is deprecated. Use import { authApi } from "@/services/api/features/auth" instead.');
        try {
            await modernAuthApi.logout();
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }
};

// Legacy user API - redirects to the new implementation
export const userApi = {
    getAll: async (token: string) => {
        logger.warn('DEPRECATED: userApi.getAll is deprecated. Use import { userApi } from "@/services/api/features/users" instead.');
        return api.get('/users');
    },

    getById: async (id: string, token: string) => {
        logger.warn('DEPRECATED: userApi.getById is deprecated. Use import { userApi } from "@/services/api/features/users" instead.');
        return api.get(`/users/${id}`);
    },

    create: async (userData: any, token: string) => {
        logger.warn('DEPRECATED: userApi.create is deprecated. Use import { userApi } from "@/services/api/features/users" instead.');
        return api.post('/users', userData);
    },

    update: async (id: string, userData: any, token: string) => {
        logger.warn('DEPRECATED: userApi.update is deprecated. Use import { userApi } from "@/services/api/features/users" instead.');
        return api.put(`/users/${id}`, userData);
    },

    delete: async (id: string, token: string) => {
        logger.warn('DEPRECATED: userApi.delete is deprecated. Use import { userApi } from "@/services/api/features/users" instead.');
        return api.delete(`/users/${id}`);
    }
};

// Export the centralized API client for direct use
export default api; 