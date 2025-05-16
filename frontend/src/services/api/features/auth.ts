/**
 * Authentication API Service
 *
 * This service provides methods for interacting with authentication endpoints.
 */

import { api } from "@/services/api/middleware/apiMiddleware";
import { authEndpoints } from "@/services/api/endpoints/authEndpoints";
import { AuthService } from '@/services/authService';
import logger from "@/utils/logger";
import { Permission, Role, rolePermissions } from '@/types/permissions';

const authService = AuthService.getInstance();

// Flag to prevent duplicate register calls
let isRegisterInProgress = false;

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
  role: Role;
  avatar?: string;
  permissions?: Permission[];
  last_login?: string;
  created_at: string;
  updated_at: string;
  emailVerified?: boolean;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  user: User;
  access_token?: string;
  token_type?: string;
  expiresAt?: string;
  errors?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Ensure we have CSRF token before login
      await authService.getCsrfToken();
      
      const response = await api.post<AuthResponse>(authEndpoints.login, credentials);
      const responseData = response.data;
      
      if (responseData?.status === 'success') {
        const convertedUser = convertUser(responseData.user);
        authService.setUser(convertedUser);
        return {
          status: 'success',
          message: 'Login successful',
          user: convertedUser,
          access_token: responseData.access_token,
          token_type: responseData.token_type,
          expiresAt: responseData.expiresAt
        };
      }

      throw new Error(responseData?.message || 'Login failed');
    } catch (error: any) {
      logger.error('Login error:', error);
      
      // Handle API error response
      if (error.response?.data) {
        const apiError = error.response.data;
        throw {
          status: 'error',
          message: apiError.message || 'Login failed',
          errors: apiError.errors || { general: [apiError.message || 'Login failed'] }
        };
      }

      // Handle network errors
      throw {
        status: 'error',
        message: error.message || 'Failed to login. Please try again.',
        errors: { general: [error.message || 'Failed to login. Please try again.'] }
      };
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Prevent duplicate register calls
    if (isRegisterInProgress) {
      throw new Error('Registration is already in progress');
    }

    isRegisterInProgress = true;
    try {
      await authService.getCsrfToken();
      const response = await api.post<AuthResponse>(authEndpoints.register, data);
      const { data: responseData } = response;

      if (responseData.status === 'success') {
        authService.setUser(convertUser(responseData.user));
      }

      return responseData;
    } catch (error: any) {
      logger.error('Registration failed:', error);
      throw error;
    } finally {
      isRegisterInProgress = false;
    }
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      // Ensure CSRF token before logout
      await authService.getCsrfToken();

      // Call the logout endpoint
      await api.post<void>(authEndpoints.logout);

      // Clear auth data
      authService.clearAuth();
    } catch (error) {
      logger.error('Logout failed:', error);
      // Still remove auth data even if the API call fails
      authService.clearAuth();
    }
  },

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Protection against multiple simultaneous requests
      if (authService.isProfileRequestInProgress()) {
        const cachedUser = authService.getUser();
        if (cachedUser) return convertUser(cachedUser);
        throw new Error('Profile request already in progress');
      }

      // Hard limit on requests per page load
      const profileRequestCount = authService.getProfileRequestCount();
      if (profileRequestCount >= 5) {
        const cachedUser = authService.getUser();
        if (cachedUser) return convertUser(cachedUser);
        throw new Error('Too many profile requests');
      }

      // Rate limiting based on time
      if (authService.wasProfileFetchedRecently()) {
        const cachedUser = authService.getUser();
        if (cachedUser) return convertUser(cachedUser);
      }

      // Check session-level cache
      const cachedProfileResponse = authService.getCachedProfileResponse();
      if (cachedProfileResponse) {
        return cachedProfileResponse.data;
      }

      // Set flag to prevent concurrent requests
      authService.setProfileRequestFlag();
      authService.incrementProfileRequestCount();

      try {
        // Get fresh user data
        const response = await api.get<User>(authEndpoints.me);

        if (response.data) {
          // Update cache
          authService.setUser(convertUser(response.data));
          authService.cacheProfileResponse(response);
          authService.markProfileFetched();
          return response.data;
        }

        throw new Error('Failed to fetch user profile');
      } finally {
        // Always clear the flag
        authService.clearProfileRequestFlag();
      }
    } catch (error) {
      // Fall back to stored user if available
      const storedUser = authService.getUser();
      if (storedUser) return storedUser;

      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await authService.getCsrfToken();
      const response = await api.patch<User>(authEndpoints.userProfile, data);
      const updatedUser = response.data;

      authService.setUser(convertUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  },

  /**
   * Request a password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await authService.getCsrfToken();
      await api.post<void>(authEndpoints.forgotPassword, { email });
    } catch (error: any) {
      logger.error('Password reset request failed:', error);
      throw error;
    }
  },

  /**
   * Change current user's password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await authService.getCsrfToken();
      await api.post<void>(authEndpoints.changePassword, {
        current_password: currentPassword,
        password: newPassword
      });
    } catch (error: any) {
      logger.error('Password change failed:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await authService.getCsrfToken();
      await api.post<void>(authEndpoints.verifyEmail, { token });
    } catch (error: any) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  },

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<{ token: string; expiresAt: string }> {
    try {
      await authService.getCsrfToken();
      const response = await api.post<{ token: string; expiresAt: string }>(authEndpoints.refreshToken);
      return response.data;
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  },

  /**
   * Get all active sessions for the current user
   */
  async getSessions(): Promise<any[]> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await authService.getCsrfToken();
      const response = await api.get<UserSession[]>(authEndpoints.sessions);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get sessions:', error);
      throw error;
    }
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await authService.getCsrfToken();
      await api.delete(`${authEndpoints.sessions}/${sessionId}`);
    } catch (error: any) {
      logger.error('Failed to revoke session:', error);
      throw error;
    }
  },

  /**
   * Check if the current user has a specific role
   */
  async hasRole(role: string | string[]): Promise<boolean> {
    try {
      const user = authService.getUser();
      if (!user) {
        return false;
      }

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    } catch (error: any) {
      logger.error('Role check failed:', error);
      return false;
    }
  },

  /**
   * Change a user's role (admin only)
   */
  async changeUserRole(userId: string, role: string): Promise<User> {
    try {
      const user = authService.getUser();
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized to change user roles');
      }

      await authService.getCsrfToken();
      const response = await api.put<User>(`${authEndpoints.users}/${userId}/role`, { role });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to change user role:', error);
      throw error;
    }
  },

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = authService.getUser();
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized to view user');
      }

      await authService.getCsrfToken();
      const response = await api.get<User>(`${authEndpoints.users}/${userId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user:', error);
      throw error;
    }
  },

  /**
   * Get all users (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 20): Promise<{ users: User[]; total: number }> {
    try {
      const user = authService.getUser();
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized to view users');
      }

      await authService.getCsrfToken();
      const response = await api.get<{ users: User[]; total: number }>(`${authEndpoints.users}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  },

  /**
   * Check if the current user has a specific permission
   */
  async hasPermission(permission: Permission): Promise<boolean> {
    try {
      const user = authService.getUser();
      if (!user) {
        return false;
      }

      // Check if user has permission based on their role
      const userRolePermissions = rolePermissions[user.role];
      if (!userRolePermissions) {
        return false;
      }

      return userRolePermissions.includes(permission);
    } catch (error: any) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }
};
function convertUser(data: Partial<User>): import("../../../types/user").User {
  return {
    id: data.id,
    name: data.name || '',
    email: data.email,
    role: data.role,
    avatar: data.avatar,
    permissions: data.permissions,
    last_login: data.last_login,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

