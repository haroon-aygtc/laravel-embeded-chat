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
  FindSimilarParams
} from "../types/knowledgeBase";
import { knowledgeBaseCoreApi } from "./api/features/knowledgebase/knowledgebasefeatures";

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
   * Delete multiple entries in a single operation
   */
  async bulkDeleteEntries(entryIds: string[]): Promise<{ message: string; deleted_count: number }> {
    try {
      const response = await knowledgeBaseCoreApi.bulkDeleteEntries({ entry_ids: entryIds });

      // Since we don't know which knowledge bases the entries belonged to,
      // we can't specifically clear their caches. Instead, we'll clear all entry caches.
      this.clearCacheByPrefix("entries-");

      return response;
    } catch (error) {
      console.error(`Error bulk deleting entries:`, error);
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
   * Generate embeddings for all entries in a knowledge base
   */
  async generateEmbeddings(knowledgeBaseId: string): Promise<{ message: string; processed_entries: number }> {
    try {
      return await knowledgeBaseCoreApi.generateEmbeddings(knowledgeBaseId);
    } catch (error) {
      console.error(`Error generating embeddings for knowledge base with ID ${knowledgeBaseId}:`, error);
      throw error;
    }
  }

  /**
   * Find entries similar to a specific entry
   */
  async findSimilar(
    entryId: string,
    params?: FindSimilarParams
  ): Promise<KnowledgeEntry[]> {
    try {
      const cacheKey = this.buildCacheKey(`similar-entries-${entryId}`, params);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData as KnowledgeEntry[];

      const similarEntries = await knowledgeBaseCoreApi.findSimilar(entryId, {
        limit: params?.limit || KNOWLEDGE_BASE_CONSTANTS.DEFAULT_SIMILAR_ENTRIES_LIMIT,
        min_similarity_score: params?.min_similarity_score || 0.7,
      });

      this.addToCache(cacheKey, similarEntries);
      return similarEntries;
    } catch (error) {
      console.error(`Error finding similar entries for entry ID ${entryId}:`, error);
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
}

// Export a singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
