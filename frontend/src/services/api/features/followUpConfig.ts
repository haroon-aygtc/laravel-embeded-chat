import { api } from "../middleware/apiMiddleware";
import { FollowUpConfigData } from "@/services/followUpConfigService";

/**
 * Follow-up Configuration API Service
 * Provides methods for interacting with follow-up configuration endpoints
 */
export const followUpConfigApi = {
  /**
   * Get all follow-up configurations for a user
   */
  getFollowUpConfigs: async (userId: string): Promise<FollowUpConfigData[]> => {
    try {
      const response = await api.get(`/follow-up-config/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error(
        `Error fetching follow-up configs for user ${userId}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Get a specific follow-up configuration
   */
  getFollowUpConfig: async (id: string): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.get(`/follow-up-config/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching follow-up config ${id}:`, error);
      return null;
    }
  },

  /**
   * Get the default follow-up configuration for a user
   */
  getDefaultFollowUpConfig: async (
    userId: string,
  ): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.get(
        `/follow-up-config/user/${userId}/default`,
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching default follow-up config for user ${userId}:`,
        error,
      );
      return null;
    }
  },

  /**
   * Create a new follow-up configuration
   */
  createFollowUpConfig: async (
    data: FollowUpConfigData,
  ): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.post("/follow-up-config", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating follow-up config:", error);
      return null;
    }
  },

  /**
   * Update an existing follow-up configuration
   */
  updateFollowUpConfig: async (
    id: string,
    data: Partial<FollowUpConfigData>,
  ): Promise<FollowUpConfigData | null> => {
    try {
      const response = await api.put(`/follow-up-config/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating follow-up config ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a follow-up configuration
   */
  deleteFollowUpConfig: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/follow-up-config/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting follow-up config ${id}:`, error);
      return false;
    }
  },
};
