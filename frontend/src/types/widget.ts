/**
 * Widget Type Definitions
 */

export interface WidgetAppearance {
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

export interface WidgetBehavior {
    initialState: 'open' | 'closed' | 'minimized';
    autoOpen: boolean;
    openDelay: number;
    notification: boolean;
    mobileBehavior: 'standard' | 'compact' | 'full';
    sounds: boolean;
}

export interface WidgetContent {
    welcomeMessage: string;
    placeholderText: string;
    botName: string;
    avatarUrl: string | null;
    allowAttachments?: boolean;
    allowVoice?: boolean;
    allowEmoji?: boolean;
}

export interface Widget {
    id: string;
    name: string;
    description: string | null;
    user_id: string;
    context_rule_id: string | null;
    knowledge_base_ids: string[] | null;
    title: string;
    subtitle: string | null;
    visual_settings: WidgetAppearance;
    behavioral_settings: WidgetBehavior;
    content_settings: WidgetContent;
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
    visual_settings: WidgetAppearance;
    behavioral_settings: WidgetBehavior;
    content_settings: WidgetContent;
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
    visual_settings?: Partial<WidgetAppearance>;
    behavioral_settings?: Partial<WidgetBehavior>;
    content_settings?: Partial<WidgetContent>;
    allowed_domains?: string[];
    is_active?: boolean;
}

export interface EmbedCode {
    embed_code: string;
    type: 'script' | 'iframe' | 'webcomponent';
    widget: {
        id: string;
        name: string;
        title: string;
    };
}

export interface DomainValidation {
    isAllowed: boolean;
    domain: string;
    allowedDomains?: string[];
}

export interface WidgetAnalytics {
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
    metadata?: Record<string, any>;
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

export type EmbedType = 'script' | 'iframe' | 'webcomponent';

export interface WidgetTimeRange {
    label: string;
    value: '7d' | '30d' | '90d';
}