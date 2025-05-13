/**
 * Chat API Service
 *
 * This service provides methods for interacting with chat endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface ChatSession {
  id: string;
  userId: string;
  widgetId?: string;
  contextRuleId?: string;
  status: "active" | "closed" | "archived";
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: "user" | "system" | "ai";
  metadata?: Record<string, any>;
  attachments?: ChatAttachment[];
  status?: "pending" | "delivered" | "read" | "moderated";
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  type: "image" | "file" | "audio" | "video";
  url: string;
  filename: string;
  filesize: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
  type?: "user" | "system" | "ai";
  metadata?: Record<string, any>;
  attachments?: Omit<ChatAttachment, "id" | "messageId" | "createdAt">[];
}

export interface CreateSessionRequest {
  userId?: string;
  widgetId?: string;
  contextRuleId?: string;
  metadata?: Record<string, any>;
}

export interface SessionQueryParams {
  status?: "active" | "closed" | "archived";
  page?: number;
  limit?: number;
}

export interface MessageQueryParams {
  limit?: number;
  before?: string;
}

export interface ChatAnalytics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  messagesByType: Record<string, number>;
  sessionsOverTime: Array<{ date: string; count: number }>;
  messagesOverTime: Array<{ date: string; count: number }>;
}

export const chatApi = {
  /**
   * Get all chat sessions
   */
  getSessions: async (
    params: SessionQueryParams = {},
  ): Promise<ApiResponse<{ sessions: ChatSession[]; totalCount: number }>> => {
    return api.get<{ sessions: ChatSession[]; totalCount: number }>(
      "/chat/sessions",
      { params },
    );
  },

  /**
   * Get a chat session by ID
   */
  getSession: async (id: string): Promise<ApiResponse<ChatSession>> => {
    return api.get<ChatSession>(`/chat/sessions/${id}`);
  },

  /**
   * Create a new chat session
   */
  createSession: async (
    data: CreateSessionRequest,
  ): Promise<ApiResponse<ChatSession>> => {
    return api.post<ChatSession>("/chat/sessions", data);
  },

  /**
   * Update a chat session
   */
  updateSession: async (
    id: string,
    data: Partial<ChatSession>,
  ): Promise<ApiResponse<ChatSession>> => {
    return api.put<ChatSession>(`/chat/sessions/${id}`, data);
  },

  /**
   * Delete a chat session
   */
  deleteSession: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/chat/sessions/${id}`);
  },

  /**
   * Get messages for a chat session
   */
  getSessionMessages: async (
    sessionId: string,
    params: MessageQueryParams = {},
  ): Promise<ApiResponse<{ messages: ChatMessage[]; hasMore: boolean }>> => {
    return api.get<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/chat/sessions/${sessionId}/messages`,
      { params },
    );
  },

  /**
   * Send a message in a chat session
   */
  sendMessage: async (
    data: SendMessageRequest,
  ): Promise<ApiResponse<ChatMessage>> => {
    return api.post<ChatMessage>("/chat/messages", data);
  },

  /**
   * Get a message by ID
   */
  getMessageById: async (id: string): Promise<ApiResponse<ChatMessage>> => {
    return api.get<ChatMessage>(`/chat/messages/${id}`);
  },

  /**
   * Update a message
   */
  updateMessage: async (
    id: string,
    data: Partial<ChatMessage>,
  ): Promise<ApiResponse<ChatMessage>> => {
    return api.put<ChatMessage>(`/chat/messages/${id}`, data);
  },

  /**
   * Delete a message
   */
  deleteMessage: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/chat/messages/${id}`);
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (
    sessionId: string,
    messageIds: string[],
  ): Promise<ApiResponse<boolean>> => {
    return api.post<boolean>(`/chat/sessions/${sessionId}/read`, {
      messageIds,
    });
  },

  /**
   * Get chat sessions for a user
   */
  getSessionsByUser: async (
    userId: string,
    params: SessionQueryParams = {},
  ): Promise<ApiResponse<{ sessions: ChatSession[]; totalCount: number }>> => {
    return api.get<{ sessions: ChatSession[]; totalCount: number }>(
      `/chat/users/${userId}/sessions`,
      { params },
    );
  },

  /**
   * Get chat sessions for a widget
   */
  getSessionsByWidget: async (
    widgetId: string,
    params: SessionQueryParams = {},
  ): Promise<ApiResponse<{ sessions: ChatSession[]; totalCount: number }>> => {
    return api.get<{ sessions: ChatSession[]; totalCount: number }>(
      `/chat/widgets/${widgetId}/sessions`,
      { params },
    );
  },

  /**
   * Upload a file attachment
   */
  uploadAttachment: async (
    file: File,
    sessionId: string,
  ): Promise<
    ApiResponse<{ url: string; filename: string; filesize: number }>
  > => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    return api.post<{ url: string; filename: string; filesize: number }>(
      "/chat/attachments/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  /**
   * Get attachments for a message
   */
  getMessageAttachments: async (
    messageId: string,
  ): Promise<ApiResponse<ChatAttachment[]>> => {
    return api.get<ChatAttachment[]>(`/chat/messages/${messageId}/attachments`);
  },

  /**
   * Delete an attachment
   */
  deleteAttachment: async (
    attachmentId: string,
  ): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/chat/attachments/${attachmentId}`);
  },

  /**
   * Archive a chat session
   */
  archiveSession: async (id: string): Promise<ApiResponse<ChatSession>> => {
    return api.put<ChatSession>(`/chat/sessions/${id}`, { status: "archived" });
  },

  /**
   * Close a chat session
   */
  closeSession: async (id: string): Promise<ApiResponse<ChatSession>> => {
    return api.put<ChatSession>(`/chat/sessions/${id}`, { status: "closed" });
  },

  /**
   * Reopen a chat session
   */
  reopenSession: async (id: string): Promise<ApiResponse<ChatSession>> => {
    return api.put<ChatSession>(`/chat/sessions/${id}`, { status: "active" });
  },

  /**
   * Get chat analytics
   */
  getAnalytics: async (
    timeRange: string = "7d",
  ): Promise<ApiResponse<ChatAnalytics>> => {
    return api.get<ChatAnalytics>("/chat/analytics", { params: { timeRange } });
  },

  /**
   * Export chat session history
   */
  exportSessionHistory: async (
    sessionId: string,
    format: "json" | "csv" | "pdf" = "json",
  ): Promise<ApiResponse<Blob>> => {
    return api.get<Blob>(`/chat/sessions/${sessionId}/export`, {
      params: { format },
      responseType: "blob",
    });
  },

  /**
   * Get recent chat activity
   */
  getRecentActivity: async (
    limit: number = 10,
  ): Promise<
    ApiResponse<{
      recentSessions: ChatSession[];
      recentMessages: ChatMessage[];
    }>
  > => {
    return api.get<{
      recentSessions: ChatSession[];
      recentMessages: ChatMessage[];
    }>("/chat/recent-activity", { params: { limit } });
  },
};
