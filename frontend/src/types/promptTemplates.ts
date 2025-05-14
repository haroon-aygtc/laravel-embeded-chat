export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
    user_id: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface CreatePromptTemplateParams {
    name: string;
    description: string;
    content: string;
    is_active?: boolean;
    priority?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface UpdatePromptTemplateParams {
    name?: string;
    description?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
    tags?: string[];
    metadata?: Record<string, any>;
} 