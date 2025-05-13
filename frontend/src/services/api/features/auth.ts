/**
 * Authentication API Service
 *
 * This service provides methods for interacting with authentication endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { setAuthToken, removeAuthToken } from "@/utils/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateData {
  currentPassword?: string;
  newPassword: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrentSession?: boolean;
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);

    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<AuthResponse>("/auth/register", data);

    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<void>("/auth/logout");
    removeAuthToken();
    return response;
  },

  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return api.get<User>("/auth/me");
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put<User>("/auth/profile", data);
  },

  /**
   * Request a password reset
   */
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/forgot-password", { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    password: string,
  ): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/reset-password", { token, password });
  },

  /**
   * Change current user's password
   */
  changePassword: async (
    data: PasswordUpdateData,
  ): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/change-password", data);
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/verify-email", { token });
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (): Promise<
    ApiResponse<{ token: string; expiresAt: string }>
  > => {
    const response = await api.post<{ token: string; expiresAt: string }>(
      "/auth/refresh-token",
    );

    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Get all active sessions for the current user
   */
  getSessions: async (): Promise<ApiResponse<UserSession[]>> => {
    return api.get<UserSession[]>("/auth/sessions");
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    return api.post<void>(`/auth/sessions/${sessionId}/revoke`);
  },

  /**
   * Check if user has a specific role
   */
  hasRole: async (role: string): Promise<ApiResponse<boolean>> => {
    return api.get<boolean>(`/auth/has-role/${role}`);
  },

  /**
   * Change a user's role (admin only)
   */
  changeUserRole: async (
    userId: string,
    role: string,
  ): Promise<ApiResponse<User>> => {
    return api.put<User>(`/auth/users/${userId}/role`, { role });
  },

  /**
   * Get user by ID (admin only)
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    return api.get<User>(`/auth/users/${userId}`);
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<{ users: User[]; total: number }>> => {
    return api.get<{ users: User[]; total: number }>(`/auth/users`, {
      params: { page, limit },
    });
  },
};
