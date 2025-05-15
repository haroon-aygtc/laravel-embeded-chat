/**
 * Widget API Endpoints
 *
 * Defines the API endpoints for widget operations
 */

// Import from the core API client instead of the missing config module
import { API_BASE_URL } from "@/services/api/core/apiClient";

// Create local apiConfig object
const apiConfig = {
  baseUrl: API_BASE_URL
};

export const widgetEndpoints = {
  // Get all widgets
  getAllWidgets: () => `${apiConfig.baseUrl}/widgets`,

  // Get a single widget by ID
  getWidgetById: (id: string) => `${apiConfig.baseUrl}/widgets/${id}`,

  // Create a new widget
  createWidget: () => `${apiConfig.baseUrl}/widgets`,

  // Update a widget
  updateWidget: (id: string) => `${apiConfig.baseUrl}/widgets/${id}`,

  // Delete a widget
  deleteWidget: (id: string) => `${apiConfig.baseUrl}/widgets/${id}`,

  // Activate a widget
  activateWidget: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/activate`,

  // Deactivate a widget
  deactivateWidget: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/deactivate`,

  // Get widget embed code
  getWidgetEmbedCode: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/embed-code`,

  // Widget client endpoints
  getWidgetConfig: (id: string) => `${apiConfig.baseUrl}/widget-client/${id}/config`,

  // Get widget session
  getWidgetSession: (sessionId: string) => `${apiConfig.baseUrl}/widget-client/sessions/${sessionId}`,

  // Create widget session
  createWidgetSession: (widgetId: string) => `${apiConfig.baseUrl}/widget-client/${widgetId}/sessions`,

  // Get messages for a session
  getSessionMessages: (sessionId: string) => `${apiConfig.baseUrl}/widget-client/sessions/${sessionId}/messages`,

  // Send a message in a session
  sendMessage: (sessionId: string) => `${apiConfig.baseUrl}/widget-client/sessions/${sessionId}/messages`,

  // Get widget analytics
  getWidgetAnalytics: (id: string, timeRange: string) => `${apiConfig.baseUrl}/widgets/${id}/analytics?timeRange=${timeRange}`,

  // Get widget usage
  getWidgetUsage: (id: string, timeRange: string) => `${apiConfig.baseUrl}/widgets/${id}/usage?timeRange=${timeRange}`,

  // Get widgets for a user
  getWidgetsByUser: (userId: string) => `${apiConfig.baseUrl}/users/${userId}/widgets`,

  // Get widget settings
  getWidgetSettings: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/settings`,

  // Update widget settings
  updateWidgetSettings: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/settings`,

  // Update widget appearance
  updateWidgetAppearance: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/appearance`,

  // Update widget behavior
  updateWidgetBehavior: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/behavior`,

  // Update allowed domains
  updateAllowedDomains: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/domains`,

  // Get allowed domains
  getAllowedDomains: (id: string) => `${apiConfig.baseUrl}/widgets/${id}/domains`,

  // Get widget config by user ID
  getWidgetConfigByUserId: (userId: string) => `${apiConfig.baseUrl}/widgets/config/user/${userId}`,

  // Create widget config
  createWidgetConfig: () => `${apiConfig.baseUrl}/widgets/config`,

  // Update widget config
  updateWidgetConfig: (id: string) => `${apiConfig.baseUrl}/widgets/config/${id}`,
};
