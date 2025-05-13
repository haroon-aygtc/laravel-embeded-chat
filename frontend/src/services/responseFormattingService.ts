/**
 * Response Formatting Service
 *
 * This service handles interactions with response formatting configurations using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface ResponseFormattingConfigData {
  id?: string;
  userId: string;
  name: string;
  enableMarkdown: boolean;
  defaultHeadingLevel: number;
  enableBulletPoints: boolean;
  enableNumberedLists: boolean;
  enableEmphasis: boolean;
  responseVariability: "concise" | "balanced" | "detailed";
  defaultTemplate?: string;
  isDefault?: boolean;
  customTemplates?: ResponseTemplateData[];
}

export interface ResponseTemplateData {
  id?: string;
  name: string;
  template: string;
  description?: string;
}

const responseFormattingService = {
  /**
   * Get all response formatting configurations for a user
   */
  getResponseFormattingConfigs: async (
    userId: string,
  ): Promise<ResponseFormattingConfigData[]> => {
    try {
      const response = await api.get<ResponseFormattingConfigData[]>(
        "/response-formatting",
        {
          params: { userId },
        },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to fetch response formatting configurations",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting response formatting configs:", error);
      throw error;
    }
  },

  /**
   * Get a specific response formatting configuration
   */
  getResponseFormattingConfig: async (
    id: string,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.get<ResponseFormattingConfigData>(
        `/response-formatting/${id}`,
      );

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message ||
            "Failed to fetch response formatting configuration",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error getting response formatting config ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get the default response formatting configuration for a user
   */
  getDefaultResponseFormattingConfig: async (
    userId: string,
  ): Promise<ResponseFormattingConfigData | null> => {
    try {
      const response = await api.get<ResponseFormattingConfigData>(
        `/response-formatting/default`,
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
            "Failed to fetch default response formatting configuration",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(
        `Error getting default response formatting config for user ${userId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Create a new response formatting configuration
   */
  createResponseFormattingConfig: async (
    data: ResponseFormattingConfigData,
  ): Promise<ResponseFormattingConfigData> => {
    try {
      const response = await api.post<ResponseFormattingConfigData>(
        "/response-formatting",
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message ||
            "Failed to create response formatting configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating response formatting config:", error);
      throw error;
    }
  },

  /**
   * Update an existing response formatting configuration
   */
  updateResponseFormattingConfig: async (
    id: string,
    data: Partial<ResponseFormattingConfigData>,
  ): Promise<ResponseFormattingConfigData> => {
    try {
      const response = await api.put<ResponseFormattingConfigData>(
        `/response-formatting/${id}`,
        data,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message ||
            "Failed to update response formatting configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating response formatting config ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a response formatting configuration
   */
  deleteResponseFormattingConfig: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/response-formatting/${id}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to delete response formatting configuration",
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting response formatting config ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all response templates
   */
  getResponseTemplates: async (): Promise<ResponseTemplateData[]> => {
    try {
      const response = await api.get<ResponseTemplateData[]>(
        "/response-formatting/templates",
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch response templates",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting response templates:", error);
      throw error;
    }
  },

  /**
   * Get a specific response template
   */
  getResponseTemplate: async (
    id: string,
  ): Promise<ResponseTemplateData | null> => {
    try {
      const response = await api.get<ResponseTemplateData>(
        `/response-formatting/templates/${id}`,
      );

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message || "Failed to fetch response template",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error getting response template ${id}:`, error);
      throw error;
    }
  },
};

export default responseFormattingService;
