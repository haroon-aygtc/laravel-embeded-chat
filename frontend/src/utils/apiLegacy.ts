/**
 * Legacy API Compatibility Layer
 * 
 * This file provides backward compatibility for code that uses the old API patterns.
 * It redirects all calls to the centralized API client.
 * 
 * DEPRECATION NOTICE: This file is for transition purposes only and will be removed.
 * Please update your code to use the centralized API client directly.
 */

import { api } from '@/services/api/core/apiClient';

// Legacy auth API - redirects to the new implementation
export const authApi = {
    login: async (email: string, password: string) => {
        console.warn('Using deprecated authApi.login. Please update to use authApi from @/services/api/features/auth');
        return api.post('/auth/login', { email, password });
    },

    register: async (name: string, email: string, password: string) => {
        console.warn('Using deprecated authApi.register. Please update to use authApi from @/services/api/features/auth');
        return api.post('/auth/register', { name, email, password });
    },

    getProfile: async (token: string) => {
        console.warn('Using deprecated authApi.getProfile. Please update to use authApi from @/services/api/features/auth');
        return api.get('/auth/me', {}, { headers: { Authorization: `Bearer ${token}` } });
    },

    logout: async (token: string) => {
        console.warn('Using deprecated authApi.logout. Please update to use authApi from @/services/api/features/auth');
        return api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    }
};

// Legacy user API - redirects to the new implementation
export const userApi = {
    getAll: async (token: string) => {
        console.warn('Using deprecated userApi.getAll. Please update to use userApi from @/services/api/features/users');
        return api.get('/users', {}, { headers: { Authorization: `Bearer ${token}` } });
    },

    getById: async (id: string, token: string) => {
        console.warn('Using deprecated userApi.getById. Please update to use userApi from @/services/api/features/users');
        return api.get(`/users/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    },

    create: async (userData: any, token: string) => {
        console.warn('Using deprecated userApi.create. Please update to use userApi from @/services/api/features/users');
        return api.post('/users', userData, { headers: { Authorization: `Bearer ${token}` } });
    },

    update: async (id: string, userData: any, token: string) => {
        console.warn('Using deprecated userApi.update. Please update to use userApi from @/services/api/features/users');
        return api.put(`/users/${id}`, userData, { headers: { Authorization: `Bearer ${token}` } });
    },

    delete: async (id: string, token: string) => {
        console.warn('Using deprecated userApi.delete. Please update to use userApi from @/services/api/features/users');
        return api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    }
};

// Export the centralized API client for direct use
export default api; 