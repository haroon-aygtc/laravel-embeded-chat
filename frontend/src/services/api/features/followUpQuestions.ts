import { api } from "../middleware/apiMiddleware";
import { FollowUpQuestionData } from "@/services/followUpQuestionService";

/**
 * Follow-up Questions API Service
 * Provides methods for interacting with follow-up questions endpoints
 */
export const followUpQuestionsApi = {
  /**
   * Get all follow-up questions for a specific configuration
   */
  getQuestionsByConfigId: async (
    configId: string,
  ): Promise<FollowUpQuestionData[]> => {
    try {
      const response = await api.get(`/follow-up-questions/${configId}`);
      return response.data.data || [];
    } catch (error) {
      console.error(
        `Error fetching follow-up questions for config ${configId}:`,
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
      const response = await api.post("/follow-up-questions", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating follow-up question:", error);
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
      const response = await api.put(`/follow-up-questions/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating follow-up question ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a follow-up question
   */
  deleteQuestion: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/follow-up-questions/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting follow-up question ${id}:`, error);
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
      await api.post(`/follow-up-questions/${configId}/reorder`, {
        questionIds,
      });
      return true;
    } catch (error) {
      console.error(
        `Error reordering follow-up questions for config ${configId}:`,
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
      const response = await api.get(`/follow-up-questions/${configId}/chat`, {
        params: { limit },
      });
      return response.data.data || [];
    } catch (error) {
      console.error(
        `Error fetching follow-up questions for chat with config ${configId}:`,
        error,
      );
      return [];
    }
  },
};
