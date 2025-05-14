"use client";

import type {
  CreateKnowledgeBaseParams,
  CreateKnowledgeEntryParams,
  KnowledgeBase,
  KnowledgeEntry,
  SearchKnowledgeParams,
  UpdateKnowledgeBaseParams,
  UpdateKnowledgeEntryParams,
  PaginatedResponse,
  GetKnowledgeBasesParams,
  GetEntriesParams,
  ImportData,
  ImportOptions,
  FindSimilarParams,
  KnowledgeBaseConfig,
  KnowledgeBaseForContextRule
} from "../types/knowledgeBase";
import { knowledgeBaseCoreApi } from "./api/features/knowledgebase/knowledgebasefeatures";
import api from './axiosConfig';

// Constants for knowledge base configuration
export const KNOWLEDGE_BASE_CONSTANTS = {
  MAX_ENTRIES_PER_PAGE: 50,
  MAX_SEARCH_RESULTS: 20,
  DEFAULT_SIMILAR_ENTRIES_LIMIT: 5,
  SOURCE_TYPES: {
    MANUAL: "manual",
    WEB: "web",
    DOCUMENT: "document",
    API: "api"
  },
  ENTRY_TYPES: {
    TEXT: "text",
    HTML: "html",
    PDF: "pdf",
    IMAGE: "image"
  },
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes in milliseconds
};

/**
 * Service for managing knowledge bases and entries
 */
class KnowledgeBaseService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Get all knowledge bases accessible to the user
   * @param params Query parameters for filtering, sorting and pagination
   */
  async getAllKnowledgeBases(params?: GetKnowledgeBasesParams): Promise<PaginatedResponse<KnowledgeBase> | KnowledgeBase[]> {
    try {
      const cacheKey = this.buildCacheKey("all-knowledge-bases", params);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData as PaginatedResponse<KnowledgeBase> | KnowledgeBase[];

      const data = await knowledgeBaseCoreApi.getAll(params);
      this.addToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      throw error;
    }
  }

  /**
   * Get a specific knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    try {
      const cacheKey = `knowledge-base-${id}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData as KnowledgeBase;

      const data = await knowledgeBaseCoreApi.getById(id);
      this.addToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching knowledge base with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(params: CreateKnowledgeBaseParams): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await knowledgeBaseCoreApi.create(params);
      this.clearCacheByPrefix("all-knowledge-bases");
      return knowledgeBase;
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      throw error;
    }
  }

  /**
   * Update an existing knowledge base
   */
  async updateKnowledgeBase(id: string, params: UpdateKnowledgeBaseParams): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await knowledgeBaseCoreApi.update(id, params);
      this.clearCacheByPrefix(`knowledge-base-${id}`);
      this.clearCacheByPrefix("all-knowledge-bases");
      return knowledgeBase;
    } catch (error) {
      console.error(`Error updating knowledge base with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(id: string): Promise<{ message: string }> {
    try {
      const response = await knowledgeBaseCoreApi.delete(id);
      this.clearCacheByPrefix(`knowledge-base-${id}`);
      this.clearCacheByPrefix("all-knowledge-bases");
      this.clearCacheByPrefix(`entries-${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting knowledge base with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get entries from a knowledge base with filtering, sorting and pagination
   */
  async getEntries(knowledgeBaseId: string, params?: GetEntriesParams): Promise<PaginatedResponse<KnowledgeEntry> | KnowledgeEntry[]> {
    try {
      const cacheKey = this.buildCacheKey(`entries-${knowledgeBaseId}`, params);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData as PaginatedResponse<KnowledgeEntry> | KnowledgeEntry[];

      const data = await knowledgeBaseCoreApi.getEntries(knowledgeBaseId, params);
      this.addToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching entries for knowledge base with ID ${knowledgeBaseId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new entry in a knowledge base
   */
  async createEntry(knowledgeBaseId: string, params: CreateKnowledgeEntryParams): Promise<KnowledgeEntry> {
    try {
      const entry = await knowledgeBaseCoreApi.createEntry(knowledgeBaseId, params);
      this.clearCacheByPrefix(`entries-${knowledgeBaseId}`);
      return entry;
    } catch (error) {
      console.error(`Error creating entry in knowledge base with ID ${knowledgeBaseId}:`, error);
      throw error;
    }
  }

  /**
   * Create multiple entries in a knowledge base in a single operation
   */
  async createBatchEntries(knowledgeBaseId: string, entries: CreateKnowledgeEntryParams[]): Promise<KnowledgeEntry[]> {
    try {
      const createdEntries = await knowledgeBaseCoreApi.createBulkEntries(knowledgeBaseId, entries);
      this.clearCacheByPrefix(`entries-${knowledgeBaseId}`);
      return createdEntries;
    } catch (error) {
      console.error(`Error batch creating entries in knowledge base with ID ${knowledgeBaseId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing knowledge entry
   */
  async updateEntry(id: string, params: UpdateKnowledgeEntryParams): Promise<KnowledgeEntry> {
    try {
      const entry = await knowledgeBaseCoreApi.updateEntry(id, params);
      // We need to clear cache for this entry's knowledge base
      if (entry.knowledge_base_id) {
        this.clearCacheByPrefix(`entries-${entry.knowledge_base_id}`);
      }
      return entry;
    } catch (error) {
      console.error(`Error updating entry with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge entry
   */
  async deleteEntry(id: string, knowledgeBaseId?: string): Promise<{ message: string }> {
    try {
      const response = await knowledgeBaseCoreApi.deleteEntry(id);

      if (knowledgeBaseId) {
        this.clearCacheByPrefix(`entries-${knowledgeBaseId}`);
      }

      return response;
    } catch (error) {
      console.error(`Error deleting entry with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete entries in bulk
   * @param entryIds Array of entry IDs to delete
   */
  async bulkDeleteEntries(entryIds: string[]): Promise<{ message: string; deleted_count: number }> {
    try {
      // Clear caches that might contain these entries
      this.clearCache();
      
      return await knowledgeBaseCoreApi.bulkDeleteEntries(entryIds);
    } catch (error) {
      console.error('Error deleting entries in bulk:', error);
      throw error;
    }
  }

  /**
   * Export a knowledge base with all its entries
   */
  async exportKnowledgeBase(id: string): Promise<{ knowledge_base: KnowledgeBase; entries: KnowledgeEntry[] }> {
    try {
      return await knowledgeBaseCoreApi.export(id);
    } catch (error) {
      console.error(`Error exporting knowledge base with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Import a knowledge base from exported data
   */
  async importKnowledgeBase(
    data: ImportData,
    options?: ImportOptions
  ): Promise<{ knowledge_base: KnowledgeBase; entries_imported: number }> {
    try {
      const result = await knowledgeBaseCoreApi.import(data, options);

      // Clear relevant cache
      this.clearCacheByPrefix("all-knowledge-bases");
      if (result.knowledge_base?.id) {
        this.clearCacheByPrefix(`knowledge-base-${result.knowledge_base.id}`);
        this.clearCacheByPrefix(`entries-${result.knowledge_base.id}`);
      }

      return result;
    } catch (error) {
      console.error(`Error importing knowledge base:`, error);
      throw error;
    }
  }

  /**
   * Find similar entries to a specific entry
   * @param entryId The ID of the entry to find similar entries for
   * @param params Parameters for finding similar entries
   */
  async findSimilarEntries(entryId: string, params?: FindSimilarParams): Promise<KnowledgeEntry[]> {
    try {
      const defaultParams: FindSimilarParams = {
        limit: KNOWLEDGE_BASE_CONSTANTS.DEFAULT_SIMILAR_ENTRIES_LIMIT,
        min_similarity_score: 0.6,
        use_vectors: true,
      };

      const mergedParams = { ...defaultParams, ...params };
      
      return await knowledgeBaseCoreApi.findSimilar(entryId, mergedParams);
    } catch (error) {
      console.error(`Error finding similar entries for entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all entries in a knowledge base
   * This process may take time depending on the number of entries
   * @param knowledgeBaseId The ID of the knowledge base
   */
  async generateEmbeddings(knowledgeBaseId: string): Promise<{ message: string; processed_entries: number; failed_entries: number }> {
    try {
      // Clear cache for this knowledge base
      this.clearKnowledgeBaseCache(knowledgeBaseId);
      
      const result = await knowledgeBaseCoreApi.generateEmbeddings(knowledgeBaseId);
      
      return result;
    } catch (error) {
      console.error(`Error generating embeddings for knowledge base ${knowledgeBaseId}:`, error);
      throw error;
    }
  }

  /**
   * Search across knowledge bases
   */
  async search(
    query: string,
    options?: {
      knowledgeBaseIds?: string[];
      maxResults?: number;
      filterByType?: string;
      tags?: string[];
    }
  ): Promise<KnowledgeEntry[]> {
    try {
      // Don't cache search results as they're likely to change frequently
      const searchParams: SearchKnowledgeParams = {
        query,
        knowledge_base_ids: options?.knowledgeBaseIds,
        max_results: options?.maxResults || KNOWLEDGE_BASE_CONSTANTS.MAX_SEARCH_RESULTS,
        filter_by_type: options?.filterByType,
        tags: options?.tags,
      };

      return await knowledgeBaseCoreApi.search(searchParams);
    } catch (error) {
      console.error(`Error searching knowledge bases for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Add data to the cache with a timestamp
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get data from the cache if it exists and hasn't expired
   */
  private getFromCache(key: string): any | null {
    const cachedItem = this.cache.get(key);

    if (!cachedItem) return null;

    // Check if the cached item has expired
    if (Date.now() - cachedItem.timestamp > KNOWLEDGE_BASE_CONSTANTS.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.data;
  }

  /**
   * Clear all cached items that start with the given prefix
   */
  private clearCacheByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Build a cache key from a base key and optional parameters
   */
  private buildCacheKey(baseKey: string, params?: Record<string, any>): string {
    if (!params) return baseKey;

    // Sort the keys to ensure consistent cache keys regardless of object property order
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .filter(key => params[key] !== undefined)
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return paramString ? `${baseKey}?${paramString}` : baseKey;
  }

  /**
   * Clear cache related to a specific knowledge base
   * @param knowledgeBaseId The ID of the knowledge base
   */
  private clearKnowledgeBaseCache(knowledgeBaseId: string): void {
    // Remove cache entries that contain this knowledge base ID
    for (const [key] of this.cache.entries()) {
      if (key.includes(knowledgeBaseId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get knowledge base configurations formatted for context rules
   */
  async getKnowledgeBaseConfigsForRules(): Promise<KnowledgeBaseForContextRule[]> {
    try {
      // Fetch all knowledge bases
      const result = await this.getAllKnowledgeBases({ per_page: 100 });
      
      // Handle both paginated and array responses
      let knowledgeBases: KnowledgeBase[];
      if ('data' in result && Array.isArray(result.data)) {
        knowledgeBases = result.data;
      } else if (Array.isArray(result)) {
        knowledgeBases = result;
      } else {
        knowledgeBases = [];
      }
      
      // Map to format needed for context rules
      return knowledgeBases.map(kb => ({
        id: kb.id,
        name: kb.name,
        description: kb.description || '',
        source_type: kb.source_type || 'manual',
        is_active: kb.is_active || true,
        is_public: kb.is_public || false,
        entries_count: kb.entries_count || 0,
        is_used: false // Default to false, will be updated when linked to a rule
      }));
    } catch (error) {
      console.error('Error fetching knowledge base configs for rules:', error);
      // Return empty array instead of throwing error to avoid breaking the UI
      return [];
    }
  }

  /**
   * Search knowledge bases for context to use in AI prompts
   * @param query User query to search with
   * @param knowledgeBaseIds Optional list of knowledge base IDs to search within
   * @param limit Maximum number of results to return
   * @returns Formatted context prompt for AI
   */
  async searchForAIContext(
    query: string,
    knowledgeBaseIds?: string[],
    limit = 3
  ): Promise<string> {
    try {
      // Search for relevant entries using the search API
      const searchResults = await this.search(query, {
        knowledgeBaseIds,
        maxResults: limit,
        // Don't filter by type to get comprehensive results
      });
      
      if (!searchResults || searchResults.length === 0) {
        return "";
      }
      
      // Format results into a context prompt for the AI
      let contextPrompt = "I am providing you with some relevant information from my knowledge base. Please use this information to help answer the user's question if applicable:\n\n";
      
      searchResults.forEach((entry, index) => {
        contextPrompt += `--- Information #${index + 1} from ${entry.knowledge_base?.name || 'Knowledge Base'} ---\n`;
        contextPrompt += `Title: ${entry.title || 'Untitled'}\n`;
        contextPrompt += `Content: ${entry.content}\n`;
        
        if (entry.source_url) {
          contextPrompt += `Source: ${entry.source_url}\n`;
        }
        
        contextPrompt += "\n";
      });
      
      contextPrompt += "When answering the user's question, incorporate the relevant information from above without explicitly mentioning that you're using a knowledge base unless specifically asked about your sources.\n";
      
      return contextPrompt;
    } catch (error) {
      console.error("Error searching knowledge base for AI context:", error);
      return "";
    }
  }

  /**
   * Get all knowledge base configurations
   */
  async getAllConfigs(page = 1, perPage = 15, sortBy = 'created_at', sortDirection = 'desc'): Promise<KnowledgeBaseConfig[]> {
    try {
      // Use the getAllKnowledgeBases method which already uses knowledgeBaseCoreApi
      const params: GetKnowledgeBasesParams = {
        page,
        per_page: perPage,
        sort_by: sortBy as any,
        sort_direction: sortDirection as any
      };
      
      const results = await this.getAllKnowledgeBases(params);
      
      // Convert to KnowledgeBaseConfig format
      if (Array.isArray(results)) {
        return results.map(kb => this.toConfigFormat(kb));
      } else if (results && 'data' in results) {
        return results.data.map(kb => this.toConfigFormat(kb));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      throw error;
    }
  }

  /**
   * Get a knowledge base configuration by ID
   */
  async getConfig(id: string): Promise<KnowledgeBaseConfig> {
    try {
      // Use the getKnowledgeBase method which already uses knowledgeBaseCoreApi
      const kb = await this.getKnowledgeBase(id);
      return this.toConfigFormat(kb);
    } catch (error) {
      console.error(`Error fetching knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new knowledge base configuration
   */
  async createConfig(data: Partial<KnowledgeBaseConfig>): Promise<KnowledgeBaseConfig> {
    try {
      // Use the createKnowledgeBase method which already uses knowledgeBaseCoreApi
      const params: CreateKnowledgeBaseParams = {
        name: data.name || '',
        description: data.description,
        source_type: data.source_type as any,
        is_public: data.is_public,
        is_active: data.is_active,
        metadata: data.metadata
      };
      
      const kb = await this.createKnowledgeBase(params);
      return this.toConfigFormat(kb);
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      throw error;
    }
  }

  /**
   * Update a knowledge base configuration
   */
  async updateConfig(id: string, data: Partial<KnowledgeBaseConfig>): Promise<KnowledgeBaseConfig> {
    try {
      // Use the updateKnowledgeBase method which already uses knowledgeBaseCoreApi
      const params: UpdateKnowledgeBaseParams = {
        name: data.name,
        description: data.description,
        source_type: data.source_type as any,
        is_public: data.is_public,
        is_active: data.is_active,
        metadata: data.metadata
      };
      
      const kb = await this.updateKnowledgeBase(id, params);
      return this.toConfigFormat(kb);
    } catch (error) {
      console.error(`Error updating knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge base configuration
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      // Use the deleteKnowledgeBase method which already uses knowledgeBaseCoreApi
      await this.deleteKnowledgeBase(id);
    } catch (error) {
      console.error(`Error deleting knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search across knowledge bases
   */
  async searchKnowledge(query: string, knowledgeBaseIds?: string[]): Promise<KnowledgeEntry[]> {
    try {
      // Use the search method which already uses knowledgeBaseCoreApi
      return await this.search(query, { knowledgeBaseIds });
    } catch (error) {
      console.error('Error searching knowledge bases:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to convert KnowledgeBase to KnowledgeBaseConfig format
   */
  private toConfigFormat(kb: KnowledgeBase): KnowledgeBaseConfig {
    return {
      id: kb.id,
      name: kb.name,
      description: kb.description || '',
      source_type: kb.source_type as any,
      is_active: kb.is_active,
      is_public: kb.is_public,
      entries_count: kb.entries_count || 0,
      metadata: kb.metadata,
      user_id: kb.user_id?.toString(),
      created_at: kb.created_at,
      updated_at: kb.updated_at,
      is_used: false
    };
  }
}

// Export a singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
