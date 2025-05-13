/**
 * User API Service
 *
 * This service provides methods for interacting with user endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { User } from "./auth";

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role: "admin" | "user" | "guest";
  isActive: boolean;
  metadata?: Record<string, any>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  roleFilter?: string;
  statusFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserListResponse {
  users: UserProfile[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const userApi = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (
    params: UserQueryParams = {},
  ): Promise<ApiResponse<UserListResponse>> => {
    return api.get<UserListResponse>("/users", { params });
  },

  /**
   * Get a user by ID
   */
  getUserById: async (id: string): Promise<ApiResponse<UserProfile>> => {
    return api.get<UserProfile>(`/users/${id}`);
  },

  /**
   * Create a new user (admin only)
   */
  createUser: async (
    userData: Omit<UserProfile, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<UserProfile>> => {
    return api.post<UserProfile>("/users", userData);
  },

  /**
   * Update a user
   */
  updateUser: async (
    id: string,
    userData: Partial<UserProfile>,
  ): Promise<ApiResponse<UserProfile>> => {
    return api.put<UserProfile>(`/users/${id}`, userData);
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/users/${id}`);
  },

  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    return api.get<UserProfile>("/users/profile");
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (
    profileData: Partial<UserProfile>,
  ): Promise<ApiResponse<UserProfile>> => {
    return api.put<UserProfile>("/users/profile", profileData);
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (
    file: File,
  ): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append("avatar", file);

    return api.post<{ avatarUrl: string }>("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Get user activity
   */
  getUserActivity: async (
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<
    ApiResponse<{ activities: UserActivity[]; totalCount: number }>
  > => {
    return api.get<{ activities: UserActivity[]; totalCount: number }>(
      `/users/${userId}/activity`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get user sessions
   */
  getUserSessions: async (userId: string): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/users/${userId}/sessions`);
  },

  /**
   * Activate a user
   */
  activateUser: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    return api.post<UserProfile>(`/users/${userId}/activate`);
  },

  /**
   * Deactivate a user
   */
  deactivateUser: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    return api.post<UserProfile>(`/users/${userId}/deactivate`);
  },

  /**
   * Get user preferences
   */
  getUserPreferences: async (): Promise<ApiResponse<Record<string, any>>> => {
    return api.get<Record<string, any>>("/users/preferences");
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: async (
    preferences: Record<string, any>,
  ): Promise<ApiResponse<Record<string, any>>> => {
    return api.put<Record<string, any>>("/users/preferences", preferences);
  },
};
