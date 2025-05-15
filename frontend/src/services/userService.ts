/**
 * User Service
 *
 * This service handles user management using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";
import { User, CreateUserDTO } from "@/types";
import { userApi } from "./api/features/user";
import { formatUserObject, mapRoleToApiRole, mapUserProfileToUser } from "@/components/admin/user-management/utils";

export interface UserListResponse {
  // Laravel paginator format
  data: User[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number;
  to?: number;
  path?: string;
  links?: Array<{ url: string | null, label: string, active: boolean }>;
  // Legacy format for backward compatibility
  users?: User[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

// Export these functions to match the imports in UserManagement.tsx
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await userApi.getUsers();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Failed to fetch users");
    }

    logger.debug('User API response:', response.data);

    // Handle different response formats
    let users: any[] = [];

    // Handle Laravel paginator response format
    if (response.data.data && Array.isArray(response.data.data)) {
      users = response.data.data;
    }
    // Legacy array format
    else if (Array.isArray(response.data)) {
      users = response.data;
    }
    // Legacy users property
    else if (response.data.users && Array.isArray(response.data.users)) {
      users = response.data.users;
    }
    // No recognized format
    else {
      logger.warn('Unrecognized user data format:', response.data);
      return [];
    }

    // Map the user objects to the User interface using the shared utility function
    return users.map(formatUserObject);
  } catch (error) {
    logger.error("Error in getUsers:", error);
    // In case of network errors, provide a more specific message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to the server");
    }
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

export const createUser = async (userData: CreateUserDTO): Promise<User | null> => {
  try {
    // Convert User role type to UserProfile role type using the shared utility function
    const userProfileData = {
      name: userData.name,
      email: userData.email,
      role: mapRoleToApiRole(userData.role),
      isActive: userData.isActive,
      // Include any other fields needed by the API
      password: userData.password
    };

    // Use the userApi feature instead of direct API calls
    const response = await userApi.createUser(userProfileData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Failed to create user");
    }

    // Map the response to a User object using the shared utility function
    return mapUserProfileToUser(response.data);
  } catch (error) {
    logger.error("Error in createUser:", error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  try {
    // Convert from User type to UserProfile type expected by userApi using the shared utility function
    const profileData: any = {
      name: userData.name,
      email: userData.email,
      isActive: userData.isActive
    };

    // Handle the role type conversion
    if (userData.role) {
      profileData.role = mapRoleToApiRole(userData.role);
    }

    const response = await userApi.updateUser(id, profileData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Failed to update user");
    }

    // Map the response to a User object using the shared utility function
    return mapUserProfileToUser(response.data);
  } catch (error) {
    logger.error(`Error in updateUser for user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    // Use the userApi feature instead of direct API calls
    const response = await userApi.deleteUser(id);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete user");
    }
    return true;
  } catch (error) {
    logger.error(`Error in deleteUser for user ${id}:`, error);
    throw error;
  }
};

export const getUserActivity = async (userId: string): Promise<any[]> => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      throw new Error("Authentication required");
    }
    const response = await userApi.getUserActivity(userId);
    return response.success && response.data ? response.data.activities : [];
  } catch (error) {
    logger.error(`Error in getUserActivity for user ${userId}:`, error);
    return [];
  }
};

// Legacy export for backward compatibility
export default {
  getAllUsers: async (
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ users: User[]; totalCount: number; page: number; pageSize: number }> => {
    try {
      const response = await api.get<{ users: User[]; totalCount: number }>("/users", {
        params: { page, pageSize },
      });

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch users");
      }

      return {
        users: response.data.users || [],
        totalCount: response.data.totalCount || 0,
        page,
        pageSize
      };
    } catch (error) {
      logger.error("Error fetching users:", error);
      return { users: [], totalCount: 0, page, pageSize };
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const response = await api.get<User>(`/users/${id}`);

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new user (admin only)
   */
  createUser,

  /**
   * Update a user (admin only)
   */
  updateUser,

  /**
   * Delete a user (admin only)
   */
  deleteUser,

  /**
   * Get user activity history
   */
  getUserActivity
};
