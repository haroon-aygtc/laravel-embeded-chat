/**
 * Vector Search Features
 * 
 * API module for vector search functionality in the knowledge base system.
 */

import api, { ApiResponse } from '../core/apiClient';
import { vectorSearchEndpoints } from '../endpoints/vectorSearchEndpoints';

// Types and interfaces
export interface KnowledgeEntryWithScore {
    id: string;
    knowledge_base_id: string;
    title: string;
    content: string;
    source_url?: string;
    source_type?: string;
    summary?: string;
    tags?: string[];
    similarity_score: number;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    parent_entry_id?: string;
}

export interface VectorSearchSettings {
    similarity_threshold?: number;
    embedding_model?: string;
    use_hybrid_search?: boolean;
    keyword_search_weight?: number;
    vector_search_weight?: number;
    auto_chunk_content?: boolean;
    chunk_size?: number;
    chunk_overlap?: number;
    vector_search_config?: Record<string, any>;
}

export interface SearchParams {
    query: string;
    knowledge_base_id?: string;
    limit?: number;
    min_similarity?: number;
}

export interface HybridSearchParams extends SearchParams {
    vector_weight?: number;
    keyword_weight?: number;
}

export interface ChunkingResult {
    chunks_created: number;
    chunks?: Array<{
        id: string;
        title: string;
        chunk_index: number;
        content_length: number;
    }>;
}

export interface EmbeddingResult {
    processed: number;
    successful: number;
    total: number;
}

export interface ChunkingProcessResult {
    processed: number;
    total: number;
}

// API Functions
export const vectorSearchApi = {
    /**
     * Perform semantic search using vector similarity
     */
    semanticSearch: async (params: SearchParams): Promise<ApiResponse<{
        query: string;
        total: number;
        results: KnowledgeEntryWithScore[];
    }>> => {
        return api.post(vectorSearchEndpoints.semanticSearch, params);
    },

    /**
     * Perform hybrid search combining vector similarity and keyword search
     */
    hybridSearch: async (params: HybridSearchParams): Promise<ApiResponse<{
        query: string;
        total: number;
        results: KnowledgeEntryWithScore[];
    }>> => {
        return api.post(vectorSearchEndpoints.hybridSearch, params);
    },

    /**
     * Generate embeddings for a specific knowledge entry
     */
    generateEmbeddings: async (entryId: string, params?: {
        force?: boolean;
    }): Promise<ApiResponse<{
        entry_id: string;
        knowledge_base_id: string;
        vector_indexed: boolean;
    }>> => {
        return api.post(vectorSearchEndpoints.generateEmbeddings(entryId), params || {});
    },

    /**
     * Generate embeddings for all entries in a knowledge base
     */
    generateEmbeddingsForKnowledgeBase: async (knowledgeBaseId: string, params?: {
        force?: boolean;
        only_unindexed?: boolean;
    }): Promise<ApiResponse<EmbeddingResult>> => {
        return api.post(
            vectorSearchEndpoints.generateEmbeddingsForKnowledgeBase(knowledgeBaseId),
            params || {}
        );
    },

    /**
     * Chunk content for a specific knowledge entry
     */
    chunkEntry: async (entryId: string, params?: {
        force?: boolean;
    }): Promise<ApiResponse<ChunkingResult>> => {
        return api.post(vectorSearchEndpoints.chunkEntry(entryId), params || {});
    },

    /**
     * Process all entries in a knowledge base for chunking
     */
    processKnowledgeBaseChunking: async (knowledgeBaseId: string, params?: {
        force?: boolean;
    }): Promise<ApiResponse<ChunkingProcessResult>> => {
        return api.post(
            vectorSearchEndpoints.processKnowledgeBaseChunking(knowledgeBaseId),
            params || {}
        );
    },

    /**
     * Update vector search settings for a knowledge base
     */
    updateVectorSearchSettings: async (knowledgeBaseId: string, settings: VectorSearchSettings): Promise<ApiResponse<{
        settings: VectorSearchSettings;
    }>> => {
        return api.put(
            vectorSearchEndpoints.updateVectorSearchSettings(knowledgeBaseId),
            settings
        );
    }
}; 