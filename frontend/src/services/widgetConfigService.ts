/**
 * Widget Configuration Service
 *
 * This service handles interactions with widget configurations using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface WidgetConfig {
  id?: string;
  initiallyOpen: boolean;
  contextMode: "restricted" | "open" | "custom";
  contextName: string;
  title: string;
  primaryColor: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnMobile?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service for managing widget configurations using the API layer
 */
export const widgetConfigService = {
  /**
   * Get the default active widget configuration
   */
  getDefaultWidgetConfig: async (): Promise<WidgetConfig> => {
    try {
      const response = await api.get<WidgetConfig>("/widgets/default");

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "No active widget configuration found",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error fetching widget configuration", error);
      throw error;
    }
  },

  /**
   * Create a new widget configuration
   */
  createWidgetConfig: async (
    config: Omit<WidgetConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<WidgetConfig> => {
    try {
      const response = await api.post<WidgetConfig>("/widgets", config);

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create widget configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating widget configuration", error);
      throw error;
    }
  },

  /**
   * Update an existing widget configuration
   */
  updateWidgetConfig: async (
    id: string,
    config: Partial<WidgetConfig>,
  ): Promise<WidgetConfig> => {
    try {
      const response = await api.put<WidgetConfig>(`/widgets/${id}`, config);

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update widget configuration",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating widget configuration with ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Get all widget configurations
   */
  getAllWidgetConfigs: async (): Promise<WidgetConfig[]> => {
    try {
      const response = await api.get<WidgetConfig[]>("/widgets");

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch widget configurations",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error fetching all widget configurations", error);
      throw error;
    }
  },

  /**
   * Delete a widget configuration
   */
  deleteWidgetConfig: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<{ success: boolean }>(`/widgets/${id}`);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete widget configuration",
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting widget configuration with ID ${id}`, error);
      throw error;
    }
  },
};

export default widgetConfigService;
