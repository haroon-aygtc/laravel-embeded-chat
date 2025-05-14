import axios from 'axios';
import { widgetService as widgetApiService } from './api/features/widgetFeatures';
import { VisualSettings, BehavioralSettings, ContentSettings } from './widgetService';

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
  name: string;
}

export const widgetClientService = {
  /**
   * Get the widget configuration
   */
  async getWidgetConfig(widgetId: string): Promise<WidgetConfig> {
    try {
      const response = await widgetApiService.getPublicWidgetConfig(widgetId);
      return response.data;
    } catch (error) {
      console.error(`Error fetching widget config for ${widgetId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new chat session for the widget
   */
  async createChatSession(widgetId: string): Promise<ChatSession> {
    try {
      const response = await widgetApiService.createPublicChatSession(widgetId);
      return response.data;
    } catch (error) {
      console.error(`Error creating chat session for widget ${widgetId}:`, error);
      throw error;
    }
  },

  /**
   * Get messages for a chat session
   */
  async getMessages(sessionId: string, page = 1, limit = 50): Promise<any> {
    try {
      // This doesn't require authentication as it's used by the widget
      const response = await axios.get(`/api/public/chat/sessions/${sessionId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Send a message in a chat session
   */
  async sendMessage(sessionId: string, message: string): Promise<any> {
    try {
      // This doesn't require authentication as it's used by the widget
      const response = await axios.post(`/api/public/chat/sessions/${sessionId}/messages`, {
        content: message,
        type: 'text'
      });
      return response.data;
    } catch (error) {
      console.error(`Error sending message in session ${sessionId}:`, error);
      throw error;
    }
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
  }
}; 