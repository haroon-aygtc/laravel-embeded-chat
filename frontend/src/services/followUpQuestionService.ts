/**
 * Follow-up Question Service
 *
 * This service handles interactions with follow-up questions using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { followUpApi, FollowUpQuestion } from "./api/features/followupfeatures";

export type FollowUpQuestionData = Omit<FollowUpQuestion, 'id'> & { id?: string };

const followUpQuestionService = {
  /**
   * Get all follow-up questions for a specific configuration
   */
  getQuestionsByConfigId: async (
    configId: string,
  ): Promise<FollowUpQuestionData[]> => {
    try {
      const response = await followUpApi.getQuestions(configId);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch follow-up questions"
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
    data: Partial<FollowUpQuestionData>,
  ): Promise<FollowUpQuestionData | null> => {
    try {
      // Make sure we have the required fields with defaults
      const questionData = {
        config_id: data.config_id,
        question: data.question || '',
        display_order: data.display_order || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        priority: data.priority || 'medium',
        display_position: data.display_position || 'middle',
      };

      const response = await followUpApi.addQuestion(
        data.config_id!,
        questionData as FollowUpQuestion,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create follow-up question"
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
      const response = await followUpApi.updateQuestion(id, data);

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update follow-up question"
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
      const response = await followUpApi.deleteQuestion(id);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete follow-up question"
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
      const response = await followUpApi.reorderQuestions(configId, questionIds);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to reorder follow-up questions"
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
      const response = await followUpApi.getQuestions(configId);

      if (!response.success) {
        throw new Error(
          response.error?.message ||
          "Failed to fetch follow-up questions for chat"
        );
      }

      // Get active questions, sorted by priority and limit to requested amount
      const questions = (response.data || [])
        .filter(q => q.is_active)
        .sort((a, b) => {
          // Sort by priority first
          const priorities = { high: 3, medium: 2, low: 1 };
          const priorityDiff =
            (priorities[b.priority] || 0) - (priorities[a.priority] || 0);

          // If same priority, sort by display order
          if (priorityDiff === 0) {
            return (a.display_order || 0) - (b.display_order || 0);
          }

          return priorityDiff;
        })
        .slice(0, limit)
        .map(q => q.question);

      return questions;
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
