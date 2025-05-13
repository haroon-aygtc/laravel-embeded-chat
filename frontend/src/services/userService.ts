/**
 * User Service
 *
 * This service handles user management using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";
import { User, CreateUserDTO } from "@/types";
import { activityApi } from "./api";

export interface UserListResponse {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Export these functions to match the imports in UserManagement.tsx
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<{ users: User[] }>("/users");
    if (!response.success || !response.data) {
      throw new Error("Failed to fetch users");
    }
    return response.data.users || [];
  } catch (error) {
    logger.error("Error in getUsers:", error);
    return [];
  }
};

export const createUser = async (userData: CreateUserDTO): Promise<User | null> => {
  try {
    const response = await api.post<User>("/users", userData);
    if (!response.success || !response.data) {
      throw new Error("Failed to create user");
    }
    return response.data;
  } catch (error) {
    logger.error("Error in createUser:", error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  try {
    const response = await api.put<User>(`/users/${id}`, userData);
    if (!response.success || !response.data) {
      throw new Error("Failed to update user");
    }
    return response.data;
  } catch (error) {
    logger.error(`Error in updateUser for user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const response = await api.delete<{ success: boolean }>(`/users/${id}`);
    if (!response.success) {
      throw new Error("Failed to delete user");
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
    return await activityApi.getByUserId(userId, token);
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
  createUser: async (userData: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  }): Promise<User> => {
    try {
      const response = await api.post<User>("/users", userData);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to create user");
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Update a user
   */
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<User>(`/users/${id}`, userData);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to update user");
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user (admin only)
   */
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<{ success: boolean }>(`/users/${id}`);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete user");
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change user password
   */
  changePassword: async (
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/users/${id}/change-password`,
        {
          currentPassword,
          newPassword,
        },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to change password");
      }

      return true;
    } catch (error) {
      logger.error(`Error changing password for user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reset user password (admin only)
   */
  resetPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    try {
      const response = await api.post<{ temporaryPassword: string }>(
        `/users/${id}/reset-password`,
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to reset password");
      }

      return response.data;
    } catch (error) {
      logger.error(`Error resetting password for user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Activate a user
   */
  activateUser: async (id: string): Promise<User> => {
    try {
      const response = await api.post<User>(`/users/${id}/activate`);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to activate user");
      }

      return response.data;
    } catch (error) {
      logger.error(`Error activating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deactivate a user
   */
  deactivateUser: async (id: string): Promise<User> => {
    try {
      const response = await api.post<User>(`/users/${id}/deactivate`);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to deactivate user");
      }

      return response.data;
    } catch (error) {
      logger.error(`Error deactivating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search users
   */
  searchUsers: async (
    query: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<UserListResponse> => {
    try {
      const response = await api.get<UserListResponse>("/users/search", {
        params: { query, page, pageSize },
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to search users");
      }

      return response.data || { users: [], totalCount: 0, page, pageSize };
    } catch (error) {
      logger.error("Error searching users:", error);
      throw error;
    }
  },
};
