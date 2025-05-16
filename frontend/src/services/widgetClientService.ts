import axios from 'axios';
import { API_BASE_URL } from "@/config/constants";
import logger from '@/utils/logger';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface VisualSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width: string;
  height: string;
  style: 'rounded' | 'square' | 'standard';
  colors: {
    primary: string;
    background: string;
    text: string;
    assistantBubble: string;
    userBubble: string;
  };
}

export interface BehavioralSettings {
  initialState: 'open' | 'closed' | 'minimized';
  allowAttachments: boolean;
  allowVoice: boolean;
  allowEmoji: boolean;
  showAfterSeconds: number;
  allowedDomains: string[] | null;
}

export interface ContentSettings {
  welcomeMessage: string;
  placeholderText: string;
  showBranding: boolean;
}

export interface WidgetConfig {
  id: string;
  title: string;
  subtitle: string | null;
  visual_settings: VisualSettings;
  behavioral_settings: BehavioralSettings;
  content_settings: ContentSettings;
  context_rule_id: string | null;
  knowledge_base_ids: string[] | null;
}

export interface ChatSession {
  session_id: string;
  token?: string;
  widget_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface FollowUpQuestion {
  id: string;
  content: string;
}

export const widgetClientService = {
  /**
   * Get the widget configuration
   */
  async getWidgetConfig(widgetId: string): Promise<WidgetConfig> {
    try {
      const response = await axios.get<ApiResponse<WidgetConfig>>(
        `${API_BASE_URL}/public/widgets/${widgetId}/config`
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get widget configuration');
    } catch (error) {
      logger.error('Error getting widget configuration:', error);
      throw error;
    }
  },

  /**
   * Create a new chat session for a widget
   * 
   * @param widgetId Widget identifier
   * @param metadata Optional session metadata
   * @returns Chat session details
   */
  async createChatSession(widgetId: string, metadata?: Record<string, any>): Promise<ChatSession> {
    try {
      const response = await axios.post<ApiResponse<ChatSession>>(
        `${API_BASE_URL}/public/widgets/${widgetId}/sessions`,
        {
          metadata: metadata || {
            referrer: window.location.href,
            userAgent: navigator.userAgent
          }
        }
      );

      if (response.data.status === 'success') {
        // Store the session ID in localStorage for persistence
        localStorage.setItem(`widget_session_${widgetId}`, response.data.data.session_id);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to create chat session');
    } catch (error) {
      logger.error('Error creating chat session:', error);
      throw error;
    }
  },

  /**
   * Get messages for a chat session
   * 
   * @param sessionId Session identifier
   * @returns Chat messages
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await axios.get<ApiResponse<{ data: ChatMessage[] }>>(
        `${API_BASE_URL}/public/chat/sessions/${sessionId}/messages`
      );

      if (response.data.status === 'success') {
        return response.data.data.data;
      }

      throw new Error(response.data.message || 'Failed to get chat messages');
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  },

  /**
   * Send a message in a chat session
   * 
   * @param sessionId Session identifier
   * @param content Message content
   * @returns Chat message details including AI response
   */
  async sendMessage(sessionId: string, content: string): Promise<{
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
  }> {
    try {
      const response = await axios.post<ApiResponse<{
        userMessage: ChatMessage;
        aiMessage: ChatMessage;
      }>>(
        `${API_BASE_URL}/public/chat/sessions/${sessionId}/messages`,
        { content, type: 'text' }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to send message');
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Validate if the current domain is allowed for the widget
   * 
   * @param widgetId Widget identifier
   * @returns Validation result
   */
  async validateDomain(widgetId: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ is_valid: boolean }>>(
        `${API_BASE_URL}/public/widgets/${widgetId}/validate-domain`,
        { domain: window.location.hostname }
      );

      return response.data.status === 'success' && response.data.data.is_valid;
    } catch (error) {
      logger.error('Error validating domain:', error);
      return false;
    }
  },

  /**
   * Get active chat session for a widget, or create new one if none exists
   * 
   * @param widgetId Widget identifier
   * @returns Chat session details
   */
  async getOrCreateSession(widgetId: string): Promise<ChatSession> {
    // Check if we have a saved session ID
    const sessionId = localStorage.getItem(`widget_session_${widgetId}`);

    if (sessionId) {
      try {
        // Verify the session exists by trying to get messages
        await this.getMessages(sessionId);

        // Return a simplified session object since we don't have the full details
        return {
          session_id: sessionId,
          widget_id: widgetId,
          created_at: new Date().toISOString()
        };
      } catch (error) {
        // Session likely expired or is invalid, create a new one
        logger.warn('Saved session invalid, creating new session');
      }
    }

    // Create a new session
    return this.createChatSession(widgetId);
  },

  /**
   * Check if current domain is allowed for the widget
   */
  isCurrentDomainAllowed(allowedDomains: string[] | null): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No domain restrictions
    }

    const currentDomain = window.location.hostname;

    return allowedDomains.some(domain => {
      // Check for exact match
      if (domain === currentDomain) {
        return true;
      }

      // Check for wildcard subdomains
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return currentDomain.endsWith(baseDomain);
      }

      return false;
    });
  },

  /**
   * Get follow-up questions for a chat session
   * 
   * @param sessionId Session identifier
   * @returns Follow-up questions
   */
  async getFollowUpQuestions(sessionId: string): Promise<FollowUpQuestion[]> {
    try {
      const response = await axios.get<ApiResponse<FollowUpQuestion[]>>(
        `${API_BASE_URL}/public/chat/sessions/${sessionId}/follow-up-questions`
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      return [];
    } catch (error) {
      logger.error('Error getting follow-up questions:', error);
      return [];
    }
  },

  /**
   * Update typing status for a chat session
   * 
   * @param sessionId Session identifier
   * @param isTyping Whether the user is typing
   * @param clientId Unique client identifier
   * @returns Success status
   */
  async updateTypingStatus(sessionId: string, isTyping: boolean, clientId: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ status: string }>>(
        `${API_BASE_URL}/public/chat/sessions/${sessionId}/typing`,
        {
          is_typing: isTyping,
          client_id: clientId
        }
      );

      return response.data.status === 'success';
    } catch (error) {
      logger.error('Error updating typing status:', error);
      return false;
    }
  }
}; 