/**
 * Role Management API Service
 *
 * This service provides methods for interacting with role management endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

export interface UserPermissions {
    role: string;
    isAdmin: boolean;
    permissions: Record<string, boolean>;
}

export interface RoleCheckResponse {
    hasRole: boolean;
}

export interface UpdateRoleRequest {
    role: 'admin' | 'editor' | 'viewer' | 'user';
}

export const roleApi = {
    /**
     * Get all roles
     */
    getRoles: async (): Promise<ApiResponse<Role[]>> => {
        return api.get<Role[]>('/roles');
    },

    /**
     * Get current user permissions
     */
    getUserPermissions: async (): Promise<ApiResponse<UserPermissions>> => {
        return api.get<UserPermissions>('/roles/permissions');
    },

    /**
     * Check if current user has a specific role
     */
    checkRole: async (role: string): Promise<ApiResponse<RoleCheckResponse>> => {
        return api.get<RoleCheckResponse>(`/roles/check/${role}`);
    },

    /**
     * Update a user's role (admin only)
     */
    updateUserRole: async (
        userId: string,
        role: 'admin' | 'editor' | 'viewer' | 'user'
    ): Promise<ApiResponse<any>> => {
        return api.put(`/roles/users/${userId}`, { role });
    }
}; 