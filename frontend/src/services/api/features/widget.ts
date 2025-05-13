/**
 * Widget API Service
 *
 * This service provides methods for interacting with widget endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface WidgetConfig {
  id: string;
  name: string;
  userId: string;
  domain: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialState: "open" | "closed" | "minimized";
  initialMessage: string;
  placeholderText: string;
  contextRuleId?: string;
  responseFormattingId?: string;
  followUpConfigId?: string;
  allowAttachments: boolean;
  allowVoice: boolean;
  allowEmoji: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetAnalytics {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  averageSessionDuration: number;
  sessionsPerDay: Array<{ date: string; count: number }>;
  messagesPerDay: Array<{ date: string; count: number }>;
  topDomains: Array<{ domain: string; count: number }>;
}

export const widgetApi = {
  /**
   * Get all widgets
   */
  getAllWidgets: async (): Promise<ApiResponse<WidgetConfig[]>> => {
    return api.get<WidgetConfig[]>("/widgets");
  },

  /**
   * Get a widget by ID
   */
  getWidgetById: async (id: string): Promise<ApiResponse<WidgetConfig>> => {
    return api.get<WidgetConfig>(`/widgets/${id}`);
  },

  /**
   * Create a new widget
   */
  createWidget: async (
    data: Omit<WidgetConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.post<WidgetConfig>("/widgets", data);
  },

  /**
   * Update a widget
   */
  updateWidget: async (
    id: string,
    data: Partial<WidgetConfig>,
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.put<WidgetConfig>(`/widgets/${id}`, data);
  },

  /**
   * Delete a widget
   */
  deleteWidget: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/widgets/${id}`);
  },

  /**
   * Get widgets for a user
   */
  getWidgetsByUser: async (
    userId: string,
  ): Promise<ApiResponse<WidgetConfig[]>> => {
    return api.get<WidgetConfig[]>(`/widgets/user/${userId}`);
  },

  /**
   * Get embed code for a widget
   */
  getEmbedCode: async (
    id: string,
  ): Promise<ApiResponse<{ embedCode: string }>> => {
    return api.get<{ embedCode: string }>(`/widgets/${id}/embed-code`);
  },

  /**
   * Get widget settings
   */
  getWidgetSettings: async (
    id: string,
  ): Promise<ApiResponse<Record<string, any>>> => {
    return api.get<Record<string, any>>(`/widgets/${id}/settings`);
  },

  /**
   * Update widget settings
   */
  updateWidgetSettings: async (
    id: string,
    settings: Record<string, any>,
  ): Promise<ApiResponse<Record<string, any>>> => {
    return api.put<Record<string, any>>(`/widgets/${id}/settings`, settings);
  },

  /**
   * Update widget appearance
   */
  updateWidgetAppearance: async (
    id: string,
    appearance: Partial<WidgetConfig["theme"]>,
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.put<WidgetConfig>(`/widgets/${id}/appearance`, {
      theme: appearance,
    });
  },

  /**
   * Update widget behavior
   */
  updateWidgetBehavior: async (
    id: string,
    behavior: {
      position?: WidgetConfig["position"];
      initialState?: WidgetConfig["initialState"];
      initialMessage?: string;
      placeholderText?: string;
      allowAttachments?: boolean;
      allowVoice?: boolean;
      allowEmoji?: boolean;
    },
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.put<WidgetConfig>(`/widgets/${id}/behavior`, behavior);
  },

  /**
   * Get widget analytics
   */
  getWidgetAnalytics: async (
    id: string,
    timeRange: string = "7d",
  ): Promise<ApiResponse<WidgetAnalytics>> => {
    return api.get<WidgetAnalytics>(`/widgets/${id}/analytics`, {
      params: { timeRange },
    });
  },

  /**
   * Get widget usage
   */
  getWidgetUsage: async (
    id: string,
    timeRange: string = "7d",
  ): Promise<ApiResponse<any>> => {
    return api.get<any>(`/widgets/${id}/usage`, { params: { timeRange } });
  },

  /**
   * Activate a widget
   */
  activateWidget: async (id: string): Promise<ApiResponse<WidgetConfig>> => {
    return api.post<WidgetConfig>(`/widgets/${id}/activate`);
  },

  /**
   * Deactivate a widget
   */
  deactivateWidget: async (id: string): Promise<ApiResponse<WidgetConfig>> => {
    return api.post<WidgetConfig>(`/widgets/${id}/deactivate`);
  },

  /**
   * Manage allowed domains for a widget
   */
  updateAllowedDomains: async (
    id: string,
    domains: string[],
  ): Promise<ApiResponse<{ domains: string[] }>> => {
    return api.put<{ domains: string[] }>(`/widgets/${id}/domains`, {
      domains,
    });
  },

  /**
   * Get allowed domains for a widget
   */
  getAllowedDomains: async (
    id: string,
  ): Promise<ApiResponse<{ domains: string[] }>> => {
    return api.get<{ domains: string[] }>(`/widgets/${id}/domains`);
  },
};
