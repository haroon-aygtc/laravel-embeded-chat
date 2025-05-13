/**
 * User Activity Service
 *
 * This service handles user activity tracking using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface UserActivity {
  id?: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface UserSession {
  id?: string;
  user_id: string;
  device_info: {
    type: string;
    name: string;
    browser: string;
    os: string;
  };
  ip_address?: string;
  location?: string;
  last_active_at: string;
  created_at?: string;
  is_active: boolean;
}

const userActivityService = {
  /**
   * Log a user activity
   */
  logActivity: async (activity: UserActivity): Promise<void> => {
    try {
      // Get IP address and user agent from browser if not provided
      if (!activity.ip_address || !activity.user_agent) {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          activity.ip_address = activity.ip_address || data.ip;
          activity.user_agent = activity.user_agent || navigator.userAgent;
        } catch (error) {
          // Silently fail if we can't get IP address
          logger.warn("Failed to get IP address", error);
        }
      }

      const apiResponse = await api.post<{ id: string }>(
        "/users/activity",
        activity,
      );

      if (!apiResponse.success) {
        logger.warn("Failed to log user activity", apiResponse.error);
      }
    } catch (error) {
      logger.error("Error logging user activity:", error);
      // Don't throw error to prevent disrupting user flow
    }
  },

  /**
   * Get user activity history
   */
  getUserActivity: async (
    userId: string,
    limit = 20,
  ): Promise<UserActivity[]> => {
    try {
      const response = await api.get<UserActivity[]>(
        `/users/${userId}/activity`,
        {
          params: { limit },
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch user activity",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error fetching user activity:", error);
      throw error;
    }
  },

  /**
   * Create or update a user session
   */
  updateSession: async (session: UserSession): Promise<void> => {
    try {
      const response = await api.post<{ id: string }>(
        "/users/sessions",
        session,
      );

      if (!response.success) {
        logger.warn("Failed to update user session", response.error);
      }
    } catch (error) {
      logger.error("Error updating user session:", error);
      // Don't throw error to prevent disrupting user flow
    }
  },

  /**
   * Get active user sessions
   */
  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    try {
      const response = await api.get<UserSession[]>(
        `/users/${userId}/sessions`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch user sessions",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error fetching user sessions:", error);
      throw error;
    }
  },

  /**
   * Terminate a specific user session
   */
  terminateSession: async (sessionId: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/users/sessions/${sessionId}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to terminate user session",
        );
      }
    } catch (error) {
      logger.error("Error terminating user session:", error);
      throw error;
    }
  },

  /**
   * Terminate all user sessions except the current one
   */
  terminateAllSessions: async (
    userId: string,
    currentSessionId: string,
  ): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/users/${userId}/sessions`,
        {
          params: { exceptSessionId: currentSessionId },
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to terminate all user sessions",
        );
      }
    } catch (error) {
      logger.error("Error terminating all user sessions:", error);
      throw error;
    }
  },

  /**
   * Log a login attempt (successful or failed)
   */
  logLoginAttempt: async (
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> => {
    return userActivityService.logActivity({
      user_id: userId,
      action: success ? "login_success" : "login_failed",
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { success },
    });
  },

  /**
   * Log a security event (password change, MFA setup, etc.)
   */
  logSecurityEvent: async (
    userId: string,
    eventType: string,
    metadata?: Record<string, any>,
  ): Promise<void> => {
    return userActivityService.logActivity({
      user_id: userId,
      action: `security_${eventType}`,
      metadata,
    });
  },
};

export default userActivityService;
