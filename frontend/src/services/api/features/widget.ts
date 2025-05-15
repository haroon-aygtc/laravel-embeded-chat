/**
 * Widget API Service
 *
 * This service provides methods for interacting with widget endpoints.
 */

import { ApiService as apiService } from "@/services/apiService";
import { widgetEndpoints } from "../endpoints/widgetEndpoints";

export interface Widget {
  id: string;
  name: string;
  description?: string;
  title: string;
  subtitle?: string;
  domain?: string;
  userId: string;
  contextRuleId?: string;
  responseFormattingId?: string;
  followUpConfigId?: string;
  knowledgeBaseIds?: string[];
  isActive: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  visualSettings: {
    primaryColor: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
  behavioralSettings: {
    initialState: "open" | "closed" | "minimized";
    autoOpen?: boolean;
    openDelay?: number;
  };
  contentSettings: {
    initialMessage?: string;
    placeholderText?: string;
    allowAttachments?: boolean;
    allowVoice?: boolean;
    allowEmoji?: boolean;
  };
  allowedDomains?: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface for widget analytics data
export interface WidgetAnalytics {
  totalSessions: number;
  totalMessages: number;
  activeSessions: number;
  timeRange: string;
  sessionsByDay: {
    date: string;
    count: number;
  }[];
  messagesByDay: {
    date: string;
    count: number;
  }[];
  averageMessagesPerSession: number;
  averageSessionDuration: number;
  topDomains?: {
    domain: string;
    count: number;
  }[];
  topPages?: {
    page: string;
    count: number;
  }[];
}

export interface WidgetCreateUpdateParams {
  name: string;
  description?: string;
  userId: string;
  domain?: string;
  title: string;
  subtitle?: string;
  theme: {
    primaryColor: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialState: "open" | "closed" | "minimized";
  initialMessage?: string;
  placeholderText?: string;
  contextRuleId?: string;
  responseFormattingId?: string;
  followUpConfigId?: string;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowEmoji?: boolean;
  isActive?: boolean;
  allowedDomains?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const widgetConfigApi = {
  /**
   * Get widget configuration by user ID
   */
  getByUserId: async (userId: string): Promise<any> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetConfigByUserId(userId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching widget config for user ${userId}:`, error);
      return null;
    }
  },

  /**
   * Create widget configuration
   */
  create: async (config: any): Promise<any> => {
    try {
      const response = await apiService.post(widgetEndpoints.createWidgetConfig(), config);
      return response.data;
    } catch (error) {
      console.error("Error creating widget config:", error);
      return null;
    }
  },

  /**
   * Update widget configuration
   */
  update: async (id: string, config: any): Promise<any> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateWidgetConfig(id), config);
      return response.data;
    } catch (error) {
      console.error(`Error updating widget config ${id}:`, error);
      return null;
    }
  }
};

export const widgetApi = {
  /**
   * Get all widgets
   */
  getAllWidgets: async (): Promise<ApiResponse<Widget[]>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getAllWidgets());
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Error fetching widgets:", error);
      return {
        success: false,
        message: "Failed to fetch widgets"
      };
    }
  },

  /**
   * Get a widget by ID
   */
  getWidgetById: async (id: string): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetById(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch widget"
      };
    }
  },

  /**
   * Create a new widget
   */
  createWidget: async (widget: WidgetCreateUpdateParams): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.post(widgetEndpoints.createWidget(), widget);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Error creating widget:", error);
      return {
        success: false,
        message: "Failed to create widget"
      };
    }
  },

  /**
   * Update a widget
   */
  updateWidget: async (id: string, widget: WidgetCreateUpdateParams): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateWidget(id), widget);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to update widget"
      };
    }
  },

  /**
   * Delete a widget
   */
  deleteWidget: async (id: string): Promise<ApiResponse<null>> => {
    try {
      await apiService.delete(widgetEndpoints.deleteWidget(id));
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to delete widget"
      };
    }
  },

  /**
   * Activate a widget
   */
  activateWidget: async (id: string): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.post(widgetEndpoints.activateWidget(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error activating widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to activate widget"
      };
    }
  },

  /**
   * Deactivate a widget
   */
  deactivateWidget: async (id: string): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.post(widgetEndpoints.deactivateWidget(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deactivating widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to deactivate widget"
      };
    }
  },

  /**
   * Get widget embed code
   */
  getWidgetEmbedCode: async (id: string): Promise<ApiResponse<{ code: string }>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetEmbedCode(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching embed code for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch embed code"
      };
    }
  },

  /**
   * Get widget analytics
   */
  getWidgetAnalytics: async (
    id: string,
    timeRange: string = "7d",
  ): Promise<ApiResponse<WidgetAnalytics>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetAnalytics(id, timeRange));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching analytics for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch widget analytics"
      };
    }
  },

  /**
   * Get widget usage
   */
  getWidgetUsage: async (
    id: string,
    timeRange: string = "7d",
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetUsage(id, timeRange));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching usage for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch widget usage"
      };
    }
  },

  /**
   * Get widgets for a user
   */
  getWidgetsByUser: async (
    userId: string,
  ): Promise<ApiResponse<Widget[]>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetsByUser(userId));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching widgets for user ${userId}:`, error);
      return {
        success: false,
        message: "Failed to fetch user's widgets"
      };
    }
  },

  /**
   * Get widget settings
   */
  getWidgetSettings: async (
    id: string,
  ): Promise<ApiResponse<Record<string, any>>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getWidgetSettings(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching settings for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch widget settings"
      };
    }
  },

  /**
   * Update widget settings
   */
  updateWidgetSettings: async (
    id: string,
    settings: Record<string, any>,
  ): Promise<ApiResponse<Record<string, any>>> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateWidgetSettings(id), settings);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating settings for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to update widget settings"
      };
    }
  },

  /**
   * Update widget appearance
   */
  updateWidgetAppearance: async (
    id: string,
    appearance: Partial<Widget["visualSettings"]>,
  ): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateWidgetAppearance(id), {
        visualSettings: appearance,
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating appearance for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to update widget appearance"
      };
    }
  },

  /**
   * Update widget behavior
   */
  updateWidgetBehavior: async (
    id: string,
    behavior: {
      position?: Widget["position"];
      initialState?: Widget["behavioralSettings"]["initialState"];
      initialMessage?: string;
      placeholderText?: string;
      allowAttachments?: boolean;
      allowVoice?: boolean;
      allowEmoji?: boolean;
    },
  ): Promise<ApiResponse<Widget>> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateWidgetBehavior(id), behavior);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating behavior for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to update widget behavior"
      };
    }
  },

  /**
   * Manage allowed domains for a widget
   */
  updateAllowedDomains: async (
    id: string,
    domains: string[],
  ): Promise<ApiResponse<{ domains: string[] }>> => {
    try {
      const response = await apiService.put(widgetEndpoints.updateAllowedDomains(id), {
        domains,
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating allowed domains for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to update allowed domains"
      };
    }
  },

  /**
   * Get allowed domains for a widget
   */
  getAllowedDomains: async (
    id: string,
  ): Promise<ApiResponse<{ domains: string[] }>> => {
    try {
      const response = await apiService.get(widgetEndpoints.getAllowedDomains(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching allowed domains for widget ${id}:`, error);
      return {
        success: false,
        message: "Failed to fetch allowed domains"
      };
    }
  },
};
