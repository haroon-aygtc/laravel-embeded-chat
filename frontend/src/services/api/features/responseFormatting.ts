import { api } from "../middleware/apiMiddleware";
import {
  ResponseFormattingConfigData,
  ResponseTemplateData,
} from "@/services/responseFormattingService";

/**
 * Response Formatting API Service
 * Provides methods for interacting with response formatting endpoints
 */
export const responseFormattingApi = {
  /**
   * Get all response formatting configurations for a user
   */
  getResponseFormattingConfigs: async (
    userId: string,
  ): Promise<ResponseFormattingConfigData[]> => {
    try {
      const response = await api.get(`/response-formatting/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error(
        `Error fetching response formatting configs for user ${userId}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Get a specific response formatting configuration
   */
  getResponseFormattingConfig: async (
    id: string,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.get(`/response-formatting/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching response formatting config ${id}:`, error);
      return null;
    }
  },

  /**
   * Get the default response formatting configuration for a user
   */
  getDefaultResponseFormattingConfig: async (
    userId: string,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.get(
        `/response-formatting/user/${userId}/default`,
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching default response formatting config for user ${userId}:`,
        error,
      );
      return null;
    }
  },

  /**
   * Create a new response formatting configuration
   */
  createResponseFormattingConfig: async (
    data: ResponseFormattingConfigData,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.post("/response-formatting", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating response formatting config:", error);
      return null;
    }
  },

  /**
   * Update an existing response formatting configuration
   */
  updateResponseFormattingConfig: async (
    id: string,
    data: Partial<ResponseFormattingConfigData>,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.put(`/response-formatting/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating response formatting config ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a response formatting configuration
   */
  deleteResponseFormattingConfig: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/response-formatting/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting response formatting config ${id}:`, error);
      return false;
    }
  },

  /**
   * Get all response templates
   */
  getResponseTemplates: async (): Promise<ResponseTemplateData[]> => {
    try {
      const response = await api.get("/response-formatting/templates");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching response templates:", error);
      return [];
    }
  },

  /**
   * Get a specific response template
   */
  getResponseTemplate: async (
    id: string,
  ): Promise<ResponseTemplateData | null> => {
    try {
      const response = await api.get(`/response-formatting/templates/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching response template ${id}:`, error);
      return null;
    }
  },
};
