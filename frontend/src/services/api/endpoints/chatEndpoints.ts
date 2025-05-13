/**
 * Chat API Endpoints
 *
 * Defines the API endpoints for chat operations
 */

export const chatEndpoints = {
  // Session management
  sessions: "/chat/sessions",
  sessionById: (id: string) => `/chat/sessions/${id}`,
  userSessions: (userId: string) => `/chat/users/${userId}/sessions`,
  widgetSessions: (widgetId: string) => `/chat/widgets/${widgetId}/sessions`,

  // Message management
  messages: "/chat/messages",
  messageById: (id: string) => `/chat/messages/${id}`,
  sessionMessages: (sessionId: string) =>
    `/chat/sessions/${sessionId}/messages`,
  markAsRead: (sessionId: string) => `/chat/sessions/${sessionId}/read`,

  // Attachments
  uploadAttachment: "/chat/attachments/upload",
  attachmentById: (id: string) => `/chat/attachments/${id}`,

  // Analytics
  analytics: "/chat/analytics",
  sessionStats: "/chat/stats/sessions",
  messageStats: "/chat/stats/messages",
};
