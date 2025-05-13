/**
 * Widget API Endpoints
 *
 * Defines the API endpoints for widget operations
 */

export const widgetEndpoints = {
  // Widget management
  widgets: "/widgets",
  widgetById: (id: string) => `/widgets/${id}`,
  userWidgets: (userId: string) => `/widgets/user/${userId}`,

  // Widget configuration
  settings: (id: string) => `/widgets/${id}/settings`,
  appearance: (id: string) => `/widgets/${id}/appearance`,
  behavior: (id: string) => `/widgets/${id}/behavior`,

  // Integration
  embedCode: (id: string) => `/widgets/${id}/embed-code`,
  domains: (id: string) => `/widgets/${id}/domains`,

  // Analytics
  analytics: (id: string) => `/widgets/${id}/analytics`,
  usage: (id: string) => `/widgets/${id}/usage`,

  // Status management
  activate: (id: string) => `/widgets/${id}/activate`,
  deactivate: (id: string) => `/widgets/${id}/deactivate`,
};
