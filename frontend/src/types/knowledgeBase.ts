/**
 * Knowledge Base Shared Types
 *
 * This file contains shared interfaces used across the knowledge base features.
 * These types provide a common structure for all knowledge base operations.
 */

// Core Knowledge Base interfaces
export interface KnowledgeBase {
    id: string;
    user_id: number;
    name: string;
    description: string | null;
    source_type: "manual" | "web" | "document" | "api";
    metadata: Record<string, any> | null;
    is_public: boolean;
    is_active: boolean;
    entries_count?: number;
    created_at: string;
    updated_at: string;
}

// Knowledge Base entry
export interface KnowledgeEntry {
    id: string;
    knowledge_base_id: string;
    title: string;
    content: string;
    source_url: string | null;
    source_type: "text" | "html" | "pdf" | "image";
    summary: string | null;
    tags: string[] | null;
    metadata: Record<string, any> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    knowledge_base?: {
        id: string;
        name: string;
        source_type: string;
    };
    similarity_score?: number;
    matched_context?: string;
}

// Query result is basically a knowledge entry with some additional fields
export interface QueryResult extends KnowledgeEntry {
    knowledge_base_name: string;
}

// Generic pagination response
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Search and Query parameters
export interface SearchKnowledgeParams {
    query: string;
    knowledge_base_ids?: string[];
    max_results?: number;
    filter_by_type?: string;
    tags?: string[];
}

export interface KnowledgeBaseQueryRequest {
    query: string;
    knowledgeBaseIds?: string[];
    contextRuleId?: string;
    maxResults?: number;
    threshold?: number;
    userId?: string;
}

// Create and Update parameters
export interface CreateKnowledgeBaseParams {
    name: string;
    description?: string;
    source_type?: "manual" | "web" | "document" | "api";
    metadata?: Record<string, any>;
    is_public?: boolean;
    is_active?: boolean;
}

export interface UpdateKnowledgeBaseParams {
    name?: string;
    description?: string | null;
    source_type?: "manual" | "web" | "document" | "api";
    metadata?: Record<string, any> | null;
    is_public?: boolean;
    is_active?: boolean;
}

export interface CreateKnowledgeEntryParams {
    title: string;
    content: string;
    source_url?: string;
    source_type?: "text" | "html" | "pdf" | "image";
    summary?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    is_active?: boolean;
    generate_embeddings?: boolean;
}

export interface UpdateKnowledgeEntryParams {
    title?: string;
    content?: string;
    source_url?: string | null;
    source_type?: "text" | "html" | "pdf" | "image";
    summary?: string | null;
    tags?: string[] | null;
    metadata?: Record<string, any> | null;
    is_active?: boolean;
    regenerate_embeddings?: boolean;
}

// Filter and pagination params
export interface GetKnowledgeBasesParams {
    page?: number;
    per_page?: number;
    sort_by?: "name" | "created_at" | "updated_at";
    sort_direction?: "asc" | "desc";
    filter_by_public?: boolean;
    filter_by_type?: "manual" | "web" | "document" | "api";
    search?: string;
}

export interface GetEntriesParams {
    page?: number;
    per_page?: number;
    sort_by?: "title" | "created_at" | "updated_at";
    sort_direction?: "asc" | "desc";
    filter_by_type?: "text" | "html" | "pdf" | "image";
    search?: string;
    tags?: string[];
}

// Similarity and embedding related interfaces
export interface FindSimilarParams {
    limit?: number;
    min_similarity_score?: number;
    use_vectors?: boolean;
}

// Import/Export related interfaces
export interface ImportOptions {
    overwrite_existing?: boolean;
}

export interface ImportData {
    knowledge_base: CreateKnowledgeBaseParams;
    entries: CreateKnowledgeEntryParams[];
}

export interface BulkDeleteEntriesParams {
    entry_ids: string[];
}

// Analytics interfaces
export interface KnowledgeBaseQueryLog {
    id: string;
    userId: string;
    query: string;
    contextRuleId?: string;
    knowledgeBaseIds: string[];
    results: number;
    timestamp: string;
}

export interface KnowledgeBaseAnalytics {
    total_bases: number;
    total_entries: number;
    entries_with_embeddings: number;
    queries_last_30_days: number;
    average_query_time: number;
    most_queried_bases: Array<{ id: string; name: string; queries: number }>;
}

// Context rules
export interface KnowledgeBaseContextRule {
    id: string;
    name: string;
    description?: string;
    knowledgeBaseIds: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Config interfaces
export interface KnowledgeBaseConfig {
    id: string;
    name: string;
    description: string;
    source_type: 'api' | 'database' | 'file' | 'scraper' | 'manual';
    is_active: boolean;
    is_public: boolean;
    entries_count?: number;
    metadata?: Record<string, any>;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
    is_used?: boolean; // For context rules integration
}

export interface KnowledgeBaseEntry {
    id: string;
    knowledge_base_id: string;
    title: string;
    content: string;
    formatted_content?: string;
    summary?: string;
    tags?: string[];
    source_url?: string;
    source_type?: string;
    vector_embedding?: number[];
    similarity_score?: number;
    metadata?: Record<string, any>;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface KnowledgeBaseSearchResult {
    id: string;
    title: string;
    content: string;
    summary?: string;
    source_url?: string;
    source_type?: string;
    similarity_score?: number;
    knowledge_base: {
        id: string;
        name: string;
        source_type: string;
    };
}

export interface KnowledgeBaseForContextRule {
    id: string;
    name: string;
    description: string;
    entries_count: number;
    source_type: string;
    is_public: boolean;
    is_used: boolean;
} 