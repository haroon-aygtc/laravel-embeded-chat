/**
 * Follow-up Question Service
 *
 * This service handles interactions with follow-up questions using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface FollowUpQuestionData {
  id?: string;
  configId: string;
  question: string;
  displayOrder?: number;
  isActive?: boolean;
}

const followUpQuestionService = {
  /**
   * Get all follow-up questions for a specific configuration
   */
  getQuestionsByConfigId: async (
    configId: string,
  ): Promise<FollowUpQuestionData[]> => {
    try {
      const response = await api.get<FollowUpQuestionData[]>(
        `/follow-up-configs/${configId}/questions`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch follow-up questions",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error(
        `Error fetching follow-up questions for config ${configId}`,
        error,
      );
      return [];
    }
  },

  /**
   * Create a new follow-up question
   */
  createQuestion: async (
    data: FollowUpQuestionData,
  ): Promise<FollowUpQuestionData | null> => {
    try {
      const response = await api.post<FollowUpQuestionData>(
        "/follow-up-questions",
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create follow-up question",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating follow-up question", error);
      return null;
    }
  },

  /**
   * Update a follow-up question
   */
  updateQuestion: async (
    id: string,
    data: Partial<FollowUpQuestionData>,
  ): Promise<FollowUpQuestionData | null> => {
    try {
      const response = await api.put<FollowUpQuestionData>(
        `/follow-up-questions/${id}`,
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update follow-up question",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating follow-up question ${id}`, error);
      return null;
    }
  },

  /**
   * Delete a follow-up question
   */
  deleteQuestion: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/follow-up-questions/${id}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete follow-up question",
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting follow-up question ${id}`, error);
      return false;
    }
  },

  /**
   * Reorder follow-up questions
   */
  reorderQuestions: async (
    configId: string,
    questionIds: string[],
  ): Promise<boolean> => {
    try {
      const response = await api.put<{ success: boolean }>(
        `/follow-up-configs/${configId}/questions/reorder`,
        {
          questionIds,
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to reorder follow-up questions",
        );
      }

      return true;
    } catch (error) {
      logger.error(
        `Error reordering follow-up questions for config ${configId}`,
        error,
      );
      return false;
    }
  },

  /**
   * Get follow-up questions for a chat session
   */
  getQuestionsForChat: async (
    configId: string,
    limit: number = 3,
  ): Promise<string[]> => {
    try {
      const response = await api.get<string[]>(
        `/follow-up-configs/${configId}/questions/chat`,
        {
          params: { limit },
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to fetch follow-up questions for chat",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error(
        `Error fetching follow-up questions for chat with config ${configId}`,
        error,
      );
      return [];
    }
  },
};

export default followUpQuestionService;
