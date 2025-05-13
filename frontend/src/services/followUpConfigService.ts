/**
 * Follow-up Configuration Service
 *
 * This service handles interactions with follow-up configurations using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface FollowUpConfigData {
  id?: string;
  userId: string;
  name: string;
  enableFollowUpQuestions: boolean;
  maxFollowUpQuestions: number;
  showFollowUpAs: "buttons" | "chips" | "list";
  generateAutomatically: boolean;
  isDefault?: boolean;
  predefinedQuestionSets?: PredefinedQuestionSetData[];
  topicBasedQuestionSets?: TopicBasedQuestionSetData[];
}

export interface PredefinedQuestionSetData {
  id?: string;
  name: string;
  description?: string;
  triggerKeywords?: string[];
  questions: string[];
}

export interface TopicBasedQuestionSetData {
  id?: string;
  topic: string;
  questions: string[];
}

const followUpConfigService = {
  /**
   * Get all follow-up configurations for a user
   */
  getFollowUpConfigs: async (userId: string): Promise<FollowUpConfigData[]> => {
    try {
      const response = await api.get<FollowUpConfigData[]>(
        `/follow-up-configs`,
        {
          params: { userId },
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch follow-up configurations",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting follow-up configs:", error);
      throw error;
    }
  },

  /**
   * Get a specific follow-up configuration
   */
  getFollowUpConfig: async (id: string): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.get<FollowUpConfigData>(
        `/follow-up-configs/${id}`,
      );

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message || "Failed to fetch follow-up configuration",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error getting follow-up config ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get the default follow-up configuration for a user
   */
  getDefaultFollowUpConfig: async (
    userId: string,
  ): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.get<FollowUpConfigData>(
        `/follow-up-configs/default`,
        {
          params: { userId },
        },
      );

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message ||
            "Failed to fetch default follow-up configuration",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(
        `Error getting default follow-up config for user ${userId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Create a new follow-up configuration
   */
  createFollowUpConfig: async (
    data: FollowUpConfigData,
  ): Promise<FollowUpConfigData> => {
    try {
      const response = await api.post<FollowUpConfigData>(
        "/follow-up-configs",
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create follow-up configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating follow-up config:", error);
      throw error;
    }
  },

  /**
   * Update an existing follow-up configuration
   */
  updateFollowUpConfig: async (
    id: string,
    data: Partial<FollowUpConfigData>,
  ): Promise<FollowUpConfigData> => {
    try {
      const response = await api.put<FollowUpConfigData>(
        `/follow-up-configs/${id}`,
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update follow-up configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating follow-up config ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a follow-up configuration
   */
  deleteFollowUpConfig: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/follow-up-configs/${id}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete follow-up configuration",
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting follow-up config ${id}:`, error);
      throw error;
    }
  },
};

export default followUpConfigService;
