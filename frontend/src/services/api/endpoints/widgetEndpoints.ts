/**
 * Widget API Endpoints
 * 
 * Defines API endpoints for widget management and operations
 */

export const widgetEndpoints = {
    // Admin/Management APIs
    getAllWidgets: '/widgets',
    getWidgetById: (id: string) => `/widgets/${id}`,
    createWidget: '/widgets',
    updateWidget: (id: string) => `/widgets/${id}`,
    deleteWidget: (id: string) => `/widgets/${id}`,

    // Widget Status Management
    activateWidget: (id: string) => `/widgets/${id}/activate`,
    deactivateWidget: (id: string) => `/widgets/${id}/deactivate`,

    // Widget Settings Updates
    updateAppearance: (id: string) => `/widgets/${id}/appearance`,
    updateBehavior: (id: string) => `/widgets/${id}/behavior`,
    updateContent: (id: string) => `/widgets/${id}/content`,

    // Domain Management
    validateDomain: (widgetId: string, domain: string) => `/widgets/${widgetId}/domains/validate?domain=${encodeURIComponent(domain)}`,
    addAllowedDomain: (widgetId: string) => `/widgets/${widgetId}/domains`,
    removeAllowedDomain: (widgetId: string, domain: string) => `/widgets/${widgetId}/domains/${encodeURIComponent(domain)}`,

    // Embedding
    getEmbedCode: (id: string, type: 'script' | 'iframe' | 'webcomponent') =>
        `/widgets/${id}/embed?type=${type}`,

    // Analytics
    getWidgetAnalytics: (id: string, timeRange: '7d' | '30d' | '90d') =>
        `/widgets/${id}/analytics?period=${timeRange}`,

    // Client-facing Widget API (used by embedded widgets)
    getWidgetConfig: (id: string) => `/widget-client/${id}/config`,
    createChatSession: (widgetId: string) => `/widget-client/${widgetId}/sessions`,
    getSessionMessages: (sessionId: string, page = 1, limit = 50) =>
        `/widget-client/sessions/${sessionId}/messages?page=${page}&limit=${limit}`,
    sendMessage: (sessionId: string) => `/widget-client/sessions/${sessionId}/messages`,
    endSession: (sessionId: string) => `/widget-client/sessions/${sessionId}/end`,

    // User Management
    getUserWidgets: (userId: string) => `/users/${userId}/widgets`,

    // Widget Status Management
    toggleWidgetStatus: (widgetId: string) => `/widgets/${widgetId}/toggle-status`,
}; 