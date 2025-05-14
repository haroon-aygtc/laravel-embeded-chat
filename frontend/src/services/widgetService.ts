import { 
  widgetService as widgetApiService,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  WidgetData,
  WidgetsResponse,
  VisualSettings,
  BehavioralSettings,
  ContentSettings
} from './api/features/widgetFeatures';

export type {
  WidgetData,
  WidgetsResponse,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  VisualSettings,
  BehavioralSettings,
  ContentSettings
};

export const widgetService = {
  /**
   * Get all widgets with pagination and filtering
   */
  async getWidgets(
    page = 1, 
    perPage = 10, 
    filters: { name?: string; is_active?: boolean } = {}
  ): Promise<WidgetsResponse> {
    try {
      return await widgetApiService.getWidgets(page, perPage, filters);
    } catch (error) {
      console.error('Error fetching widgets:', error);
      throw error;
    }
  },

  /**
   * Get a specific widget by ID
   */
  async getWidget(id: string): Promise<WidgetData> {
    try {
      const response = await widgetApiService.getWidget(id);
      return response.data;
    } catch (error) {
      console.error(`Error fetching widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new widget
   */
  async createWidget(data: CreateWidgetRequest): Promise<WidgetData> {
    try {
      const response = await widgetApiService.createWidget(data);
      return response.data;
    } catch (error) {
      console.error('Error creating widget:', error);
      throw error;
    }
  },

  /**
   * Update an existing widget
   */
  async updateWidget(id: string, data: UpdateWidgetRequest): Promise<WidgetData> {
    try {
      const response = await widgetApiService.updateWidget(id, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a widget
   */
  async deleteWidget(id: string): Promise<boolean> {
    try {
      const response = await widgetApiService.deleteWidget(id);
      return response.status === 'success';
    } catch (error) {
      console.error(`Error deleting widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle a widget's active status
   */
  async toggleWidgetStatus(id: string): Promise<WidgetData> {
    try {
      const response = await widgetApiService.toggleWidgetStatus(id);
      return response.data;
    } catch (error) {
      console.error(`Error toggling widget ${id} status:`, error);
      throw error;
    }
  },

  /**
   * Generate embed code for a widget
   */
  async generateEmbedCode(id: string, type: 'iframe' | 'webcomponent' = 'iframe'): Promise<string> {
    try {
      const response = await widgetApiService.generateEmbedCode(id, type);
      return response.data.embed_code;
    } catch (error) {
      console.error(`Error generating embed code for widget ${id}:`, error);
      throw error;
    }
  },

  /**
   * Check if a domain is allowed for a widget
   */
  async isValidDomain(id: string, domain: string): Promise<boolean> {
    try {
      const response = await widgetApiService.validateDomain(id, domain);
      return response.data.is_valid;
    } catch (error) {
      console.error(`Error validating domain for widget ${id}:`, error);
      return false;
    }
  },

  /**
   * Default widget settings
   */
  getDefaultSettings(): {
    visual: VisualSettings;
    behavioral: BehavioralSettings;
    content: ContentSettings;
  } {
    return {
      visual: {
        position: 'bottom-right',
        theme: 'light',
        colors: {
          primary: '#4F46E5',
          secondary: '#10B981',
          background: '#FFFFFF',
          text: '#1F2937'
        },
        style: 'rounded',
        width: '380px',
        height: '600px',
        showHeader: true,
        showFooter: true
      },
      behavioral: {
        autoOpen: false,
        openDelay: 3,
        notification: true,
        mobileBehavior: 'standard',
        sounds: false
      },
      content: {
        welcomeMessage: 'Hello! How can I assist you today?',
        placeholderText: 'Type your message...',
        botName: 'AI Assistant',
        avatarUrl: null
      }
    };
  }
}; 