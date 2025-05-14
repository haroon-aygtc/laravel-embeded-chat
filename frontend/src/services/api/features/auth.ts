/**
 * Authentication API Service
 *
 * This service provides methods for interacting with authentication endpoints.
 */

import api from "@/services/axiosConfig";
import { ensureCsrf } from "@/services/axiosConfig";
import { setAuthToken, removeAuthToken, setAuthUser, getCsrfToken } from "@/utils/auth";
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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Get CSRF token first
      logger.info('Fetching CSRF token before login');
      await getCsrfToken();

      const response = await api.post<AuthResponse>("/auth/login", credentials);

      if (response.data) {
        setAuthToken(response.data.token);
        setAuthUser(response.data.user);
        logger.info('Login successful');
      }

      return response.data;
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Prevent duplicate register calls
    if (isRegisterInProgress) {
      logger.warn('Registration request already in progress');
      throw new Error('Registration is already in progress. Please wait.');
    }

    try {
      isRegisterInProgress = true;

      // Get CSRF token first if needed - use one consistent approach
      logger.info('Preparing for registration');
      await getCsrfToken();

      // Make registration request
      logger.info('Sending registration request');
      const response = await api.post<AuthResponse>("/auth/register", data);

      // Process successful response
      if (response.data && response.data.token) {
        logger.info('Registration successful, storing auth data');
        // Store the authentication token
        setAuthToken(response.data.token);

        // Store the user data
        if (response.data.user) {
          setAuthUser(response.data.user);
        }
      } else {
        logger.warn('Registration response missing token or user data:', response.data);
      }

      return response.data;
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
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
      await getCsrfToken();
      await api.post<void>("/auth/logout");
    } finally {
      // Clean up regardless of server response
      removeAuthToken();
    }
  },

  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    await getCsrfToken();
    const response = await api.put<User>("/auth/profile", data);
    return response.data;
  },

  /**
   * Request a password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await getCsrfToken();
    await api.post<void>("/auth/forgot-password", { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await getCsrfToken();
    await api.post<void>("/auth/reset-password", { token, password });
  },

  /**
   * Change current user's password
   */
  changePassword: async (data: PasswordUpdateData): Promise<void> => {
    await getCsrfToken();
    await api.post<void>("/auth/change-password", data);
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<void> => {
    await getCsrfToken();
    await api.post<void>("/auth/verify-email", { token });
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (): Promise<{ token: string; expiresAt: string }> => {
    await getCsrfToken();
    const response = await api.post<{ token: string; expiresAt: string }>("/auth/refresh-token");

    if (response.data) {
      setAuthToken(response.data.token);
    }

    return response.data;
  },

  /**
   * Get all active sessions for the current user
   */
  getSessions: async (): Promise<UserSession[]> => {
    const response = await api.get<UserSession[]>("/auth/sessions");
    return response.data;
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    await getCsrfToken();
    await api.post<void>(`/auth/sessions/${sessionId}/revoke`);
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
