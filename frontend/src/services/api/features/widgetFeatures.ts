import axios from 'axios';
import { widgetEndpoints } from '../endpoints/widgetEndpoints';
import logger from '@/utils/logger';

export interface VisualSettings {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  style: 'rounded' | 'square' | 'soft';
  width: string;
  height: string;
  showHeader: boolean;
  showFooter: boolean;
}

export interface BehavioralSettings {
  initialState: 'open' | 'closed' | 'minimized';
  autoOpen: boolean;
  openDelay: number;
  notification: boolean;
  mobileBehavior: 'standard' | 'compact' | 'full';
  sounds: boolean;
}

export interface ContentSettings {
  welcomeMessage: string;
  placeholderText: string;
  botName: string;
  avatarUrl: string | null;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowEmoji?: boolean;
}

export interface WidgetData {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  context_rule_id: string | null;
  knowledge_base_ids: string[] | null;
  title: string;
  subtitle: string | null;
  visual_settings: VisualSettings;
  behavioral_settings: BehavioralSettings;
  content_settings: ContentSettings;
  allowed_domains: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetRequest {
  name: string;
  description?: string;
  context_rule_id?: string;
  knowledge_base_ids?: string[];
  title: string;
  subtitle?: string;
  visual_settings: VisualSettings;
  behavioral_settings: BehavioralSettings;
  content_settings: ContentSettings;
  allowed_domains?: string[];
  is_active?: boolean;
}

export interface UpdateWidgetRequest {
  name?: string;
  description?: string;
  context_rule_id?: string;
  knowledge_base_ids?: string[];
  title?: string;
  subtitle?: string;
  visual_settings?: Partial<VisualSettings>;
  behavioral_settings?: Partial<BehavioralSettings>;
  content_settings?: Partial<ContentSettings>;
  allowed_domains?: string[];
  is_active?: boolean;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface EmbedCodeResponse {
  status: string;
  data: {
    embed_code: string;
    type: 'script' | 'iframe' | 'webcomponent';
    widget: {
      id: string;
      name: string;
      title: string;
    };
  };
  message?: string;
}

export interface DomainValidationResponse {
  status: string;
  data: {
    isAllowed: boolean;
    domain: string;
    allowedDomains?: string[];
  };
  message?: string;
}

export interface AnalyticsData {
  widget: {
    id: string;
    name: string;
    title: string;
  };
  metrics: {
    totalSessions: number;
    totalMessages: number;
    uniqueUsers: number;
    averageSessionLength: number;
    timeRange: string;
  };
  chartData: {
    sessions: Array<{ date: string; count: number }>;
    messages: Array<{ date: string; count: number }>;
  };
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface ChatSession {
  id: string;
  widget_id: string;
  name?: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
  messages?: ChatMessage[];
}

export const widgetService = {
  /**
   * Get all widgets for the current user
   */
  async getAllWidgets(): Promise<ApiResponse<WidgetData[]>> {
    try {
      const response = await axios.get(widgetEndpoints.getAllWidgets);
      return {
        status: 'success',
        data: response.data,
        message: 'Widgets retrieved successfully'
      };
    } catch (error) {
      logger.error('Error retrieving widgets:', error);
      throw error;
    }
  },

  /**
   * Get a specific widget by ID
   */
  async getWidgetById(id: string): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.get(widgetEndpoints.getWidgetById(id));
      return {
        status: 'success',
        data: response.data,
        message: 'Widget retrieved successfully'
      };
    } catch (error) {
      logger.error(`Error retrieving widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new widget
   */
  async createWidget(data: CreateWidgetRequest): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.post(widgetEndpoints.createWidget, data);
      return {
        status: 'success',
        data: response.data,
        message: 'Widget created successfully'
      };
    } catch (error) {
      logger.error('Error creating widget:', error);
      throw error;
    }
  },

  /**
   * Update an existing widget
   */
  async updateWidget(id: string, data: UpdateWidgetRequest): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.put(widgetEndpoints.updateWidget(id), data);
      return {
        status: 'success',
        data: response.data,
        message: 'Widget updated successfully'
      };
    } catch (error) {
      logger.error(`Error updating widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a widget
   */
  async deleteWidget(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await axios.delete(widgetEndpoints.deleteWidget(id));
      return {
        status: 'success',
        data: null,
        message: response.data.message || 'Widget deleted successfully'
      };
    } catch (error) {
      logger.error(`Error deleting widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Activate a widget
   */
  async activateWidget(id: string): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.post(widgetEndpoints.activateWidget(id));
      return {
        status: 'success',
        data: response.data,
        message: 'Widget activated successfully'
      };
    } catch (error) {
      logger.error(`Error activating widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deactivate a widget
   */
  async deactivateWidget(id: string): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.post(widgetEndpoints.deactivateWidget(id));
      return {
        status: 'success',
        data: response.data,
        message: 'Widget deactivated successfully'
      };
    } catch (error) {
      logger.error(`Error deactivating widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle a widget's active status
   */
  async toggleWidgetStatus(id: string): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.post(widgetEndpoints.toggleWidgetStatus(id));
      return response.data;
    } catch (error) {
      logger.error(`Error toggling widget status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Generate embed code for a widget
   */
  async generateEmbedCode(id: string, type: 'script' | 'iframe' | 'webcomponent' = 'script'): Promise<EmbedCodeResponse> {
    try {
      const response = await axios.get(`${widgetEndpoints.generateEmbedCode(id)}?type=${type}`);
      return response.data;
    } catch (error) {
      logger.error(`Error generating embed code for widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Validate if a domain is allowed for a widget
   */
  async validateDomain(id: string, domain: string): Promise<DomainValidationResponse> {
    try {
      const response = await axios.post(widgetEndpoints.validateDomain(id), { domain });
      return response.data;
    } catch (error) {
      logger.error(`Error validating domain for widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get analytics data for a widget
   */
  async getAnalytics(id: string, timeRange: '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse<AnalyticsData>> {
    try {
      const response = await axios.get(`${widgetEndpoints.getAnalytics(id)}?time_range=${timeRange}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting analytics for widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get the default widget configuration
   */
  async getDefaultWidget(): Promise<ApiResponse<WidgetData>> {
    try {
      const response = await axios.get(widgetEndpoints.getDefaultWidget);
      return response.data;
    } catch (error) {
      logger.error('Error getting default widget configuration:', error);
      throw error;
    }
  },

  /**
   * Get widgets by user ID
   */
  async getWidgetsByUser(userId: string): Promise<ApiResponse<WidgetData[]>> {
    try {
      const response = await axios.get(widgetEndpoints.getWidgetsByUser(userId));
      return response.data;
    } catch (error) {
      logger.error(`Error getting widgets for user ${userId}:`, error);
      throw error;
    }
  },

  // Public widget client methods

  /**
   * Get public widget configuration (no auth required)
   */
  async getPublicWidgetConfig(id: string): Promise<ApiResponse<Partial<WidgetData>>> {
    try {
      const response = await axios.get(widgetEndpoints.publicWidgetConfig(id));
      return response.data;
    } catch (error) {
      logger.error(`Error getting public widget config for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new chat session for a widget (no auth required)
   */
  async createChatSession(widgetId: string): Promise<ApiResponse<{ session_id: string; name: string }>> {
    try {
      const response = await axios.post(widgetEndpoints.createPublicChatSession(widgetId));
      return response.data;
    } catch (error) {
      logger.error(`Error creating chat session for widget ${widgetId}:`, error);
      throw error;
    }
  },

  /**
   * Get messages for a session
   */
  async getSessionMessages(sessionId: string, page = 1, limit = 50): Promise<ApiResponse<{ data: ChatMessage[]; pagination: any }>> {
    try {
      const response = await axios.get(`${widgetEndpoints.getSessionMessages(sessionId)}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting messages for session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Send a message in a session
   */
  async sendMessage(sessionId: string, content: string, attachments?: File[]): Promise<ApiResponse<ChatMessage>> {
    try {
      const formData = new FormData();
      formData.append('content', content);

      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments[]', file);
        });
      }

      const response = await axios.post(widgetEndpoints.sendSessionMessage(sessionId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending message in session ${sessionId}:`, error);
      throw error;
    }
  }
};