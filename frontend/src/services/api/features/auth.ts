/**
 * Authentication API Service
 *
 * This service provides methods for interacting with authentication endpoints.
 */

import { api } from "@/services/api/middleware/apiMiddleware";
import { authEndpoints } from "@/services/api/endpoints/authEndpoints";
import { setAuthUser, getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

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
  role: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  user: User;
  access_token: string;
  token_type: string;
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
      await getCsrfToken();

      const response = await api.post<AuthResponse>(authEndpoints.login, credentials);

      // Check for successful response
      if (response.success && response.data?.user) {
        // Store user data in memory, token will be managed by HTTP-only cookies
        setAuthUser(response.data.user);
        logger.info('Login successful');
      } else {
        logger.warn('Login response missing user data:', response.data);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Login failed:', error);

      // Format error response
      const errorMessage = error.error?.message || 'Failed to login. Please try again.';
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: errorMessage,
        errors: error.error?.details || { general: ['Failed to login. Please try again.'] }
      };

      throw errorResponse;
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Prevent duplicate register calls
    if (isRegisterInProgress) {
      logger.warn('Registration request already in progress');
      throw {
        status: 'error',
        message: 'Registration is already in progress. Please wait.',
        errors: { general: ['Registration is already in progress. Please wait.'] }
      };
    }

    try {
      isRegisterInProgress = true;

      // Ensure we have CSRF token before registration
      await getCsrfToken();

      // Make registration request
      logger.info('Sending registration request');
      const response = await api.post<AuthResponse>(authEndpoints.register, data);

      // Process successful response
      if (response.success && response.data?.user) {
        logger.info('Registration successful, storing user data');

        // Store the user data
        if (response.data.user) {
          setAuthUser(response.data.user);
        }
      } else {
        logger.warn('Registration response missing user data:', response.data);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Registration failed:', error);

      // Format error response
      const errorMessage = error.error?.message || 'Failed to register. Please try again.';
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: errorMessage,
        errors: error.error?.details || { general: ['Failed to register. Please try again.'] }
      };

      throw errorResponse;
    } finally {
      // Always reset the flag
      setTimeout(() => {
        isRegisterInProgress = false;
        logger.info('Registration flag reset after timeout');
      }, 2000); // Add a delay before allowing new register attempts
    }
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      // Ensure CSRF token before logout
      await getCsrfToken();

      // Backend will invalidate the session and clear cookies
      await api.post<void>(authEndpoints.logout);
      logger.info('Logout API call successful');
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  },

  /**
   * Get current user data
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      // Ensure we have CSRF token before getting current user
      await getCsrfToken();

      const response = await api.get<User>(authEndpoints.me);
      if (!response.success || !response.data) {
        logger.warn('Failed to get current user: No data returned from API');
        throw new Error('Failed to get current user');
      }
      return response.data;
    } catch (error: any) {
      logger.error('Error getting current user:', error);
      // If the error is a 401 Unauthorized, it's expected for non-logged in users
      if (error.status === 401) {
        logger.info('User not authenticated, as expected');
      } else {
        logger.error('Unexpected error fetching current user:', error);
      }
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    // Ensure CSRF token before updating profile
    await getCsrfToken();

    const response = await api.put<User>("/auth/profile", data);
    if (!response.success || !response.data) {
      throw new Error('Failed to update profile');
    }
    return response.data;
  },

  /**
   * Request a password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post<void>(authEndpoints.forgotPassword, { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post<void>(authEndpoints.resetPassword, { token, password });
  },

  /**
   * Change current user's password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    // Ensure CSRF token before changing password
    await getCsrfToken();

    await api.post<void>(authEndpoints.changePassword, { currentPassword, newPassword });
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<void> => {
    await api.post<void>(authEndpoints.verifyEmail, { token });
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (): Promise<{ token: string; expiresAt: string }> => {
    // Ensure CSRF token before refreshing token
    await getCsrfToken();

    const response = await api.post<{ token: string; expiresAt: string }>(authEndpoints.refreshToken);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Failed to refresh token');
  },

  /**
   * Get all active sessions for the current user
   */
  getSessions: async (): Promise<any[]> => {
    const response = await api.get<any[]>(authEndpoints.sessions);
    if (!response.success || !response.data) {
      throw new Error('Failed to get sessions');
    }
    return response.data;
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    await api.post<void>(authEndpoints.revokeSession(sessionId));
  },

  /**
   * Check if user has a specific role
   */
  hasRole: async (role: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/auth/has-role/${role}`);
    return response.data;
  },

  /**
   * Change a user's role (admin only)
   */
  changeUserRole: async (userId: string, role: string): Promise<User> => {
    await getCsrfToken();
    const response = await api.put<User>(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Get user by ID (admin only)
   */
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`/auth/users/${userId}`);
    return response.data;
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (page: number = 1, limit: number = 20): Promise<{ users: User[]; total: number }> => {
    const response = await api.get<{ users: User[]; total: number }>(`/auth/users`, {
      params: { page, limit },
    });
    return response.data;
  },
};
