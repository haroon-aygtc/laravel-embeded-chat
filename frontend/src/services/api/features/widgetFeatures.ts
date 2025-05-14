import axios from 'axios';
import { WIDGET_ENDPOINTS } from '../endpoints/widgetEndpoints';

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

export interface WidgetResponse {
  status: string;
  data: WidgetData;
  message?: string;
}

export interface WidgetsResponse {
  status: string;
  data: {
    current_page: number;
    data: WidgetData[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  message?: string;
}

export interface EmbedCodeResponse {
  status: string;
  data: {
    embed_code: string;
    type: 'iframe' | 'webcomponent';
  };
  message?: string;
}

export interface DomainValidationResponse {
  status: string;
  data: {
    is_valid: boolean;
  };
  message?: string;
}

export interface PublicWidgetConfigResponse {
  status: string;
  data: {
    id: string;
    title: string;
    subtitle: string | null;
    visual_settings: VisualSettings;
    behavioral_settings: BehavioralSettings;
    content_settings: ContentSettings;
    context_rule_id: string | null;
    knowledge_base_ids: string[] | null;
  };
  message?: string;
}

export interface CreateChatSessionResponse {
  status: string;
  data: {
    session_id: string;
    name: string;
  };
  message?: string;
}

export const widgetService = {
  /**
   * Get all widgets with pagination and filtering
   */
  async getWidgets(
    page = 1, 
    perPage = 10, 
    filters: { name?: string; is_active?: boolean } = {}
  ): Promise<WidgetsResponse> {
    const params = new URLSearchParams();
    
    // Add pagination params
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    // Add optional filters
    if (filters.name) {
      params.append('name', filters.name);
    }
    if (filters.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    
    const response = await axios.get(`${WIDGET_ENDPOINTS.getAllWidgets}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a specific widget by ID
   */
  async getWidget(id: string): Promise<WidgetResponse> {
    const response = await axios.get(WIDGET_ENDPOINTS.getWidget(id));
    return response.data;
  },

  /**
   * Create a new widget
   */
  async createWidget(data: CreateWidgetRequest): Promise<WidgetResponse> {
    const response = await axios.post(WIDGET_ENDPOINTS.createWidget, data);
    return response.data;
  },

  /**
   * Update an existing widget
   */
  async updateWidget(id: string, data: UpdateWidgetRequest): Promise<WidgetResponse> {
    const response = await axios.put(WIDGET_ENDPOINTS.updateWidget(id), data);
    return response.data;
  },

  /**
   * Delete a widget
   */
  async deleteWidget(id: string): Promise<{ status: string; message: string }> {
    const response = await axios.delete(WIDGET_ENDPOINTS.deleteWidget(id));
    return response.data;
  },

  /**
   * Toggle a widget's active status
   */
  async toggleWidgetStatus(id: string): Promise<WidgetResponse> {
    const response = await axios.post(WIDGET_ENDPOINTS.toggleWidgetStatus(id));
    return response.data;
  },

  /**
   * Generate embed code for a widget
   */
  async generateEmbedCode(id: string, type: 'iframe' | 'webcomponent' = 'iframe'): Promise<EmbedCodeResponse> {
    const response = await axios.get(`${WIDGET_ENDPOINTS.generateEmbedCode(id)}?type=${type}`);
    return response.data;
  },

  /**
   * Validate if a domain is allowed for a widget
   */
  async validateDomain(id: string, domain: string): Promise<DomainValidationResponse> {
    const response = await axios.post(WIDGET_ENDPOINTS.validateDomain(id), { domain });
    return response.data;
  },

  /**
   * Get public widget configuration (no auth required)
   */
  async getPublicWidgetConfig(id: string): Promise<PublicWidgetConfigResponse> {
    const response = await axios.get(WIDGET_ENDPOINTS.publicWidgetConfig(id));
    return response.data;
  },

  /**
   * Create a new chat session for a widget (no auth required)
   */
  async createPublicChatSession(id: string): Promise<CreateChatSessionResponse> {
    const response = await axios.post(WIDGET_ENDPOINTS.createPublicChatSession(id));
    return response.data;
  }
}; 