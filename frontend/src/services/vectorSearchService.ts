/**
 * Vector Search Service
 *
 * This service provides a high-level interface for interacting with vector search
 * functionality in the knowledge base system.
 */

import logger from "@/utils/logger";
import { vectorSearchApi, KnowledgeEntryWithScore, VectorSearchSettings } from "./api/features/vectorSearchFeatures";

export type VectorSearchResult = KnowledgeEntryWithScore;

export type SearchOptions = {
  knowledgeBaseId?: string;
  limit?: number;
  minSimilarity?: number;
  vectorWeight?: number;
  keywordWeight?: number;
};

const vectorSearchService = {
  /**
   * Perform semantic search using vector similarity
   */
  semanticSearch: async (
    query: string,
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> => {
    try {
      const response = await vectorSearchApi.semanticSearch({
        query,
        knowledge_base_id: options.knowledgeBaseId,
        limit: options.limit,
        min_similarity: options.minSimilarity
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to perform semantic search"
        );
      }

      return response.data?.results || [];
    } catch (error) {
      logger.error("Error in semantic search:", error);
      return [];
    }
  },

  /**
   * Perform hybrid search combining vector similarity and keyword search
   */
  hybridSearch: async (
    query: string,
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> => {
    try {
      const response = await vectorSearchApi.hybridSearch({
        query,
        knowledge_base_id: options.knowledgeBaseId,
        limit: options.limit,
        min_similarity: options.minSimilarity,
        vector_weight: options.vectorWeight,
        keyword_weight: options.keywordWeight
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to perform hybrid search"
        );
      }

      return response.data?.results || [];
    } catch (error) {
      logger.error("Error in hybrid search:", error);
      return [];
    }
  },

  /**
   * Generate embeddings for a specific entry
   */
  generateEmbeddings: async (
    entryId: string,
    force: boolean = false
  ): Promise<boolean> => {
    try {
      const response = await vectorSearchApi.generateEmbeddings(entryId, {
        force
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to generate embeddings"
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error generating embeddings for entry ${entryId}:`, error);
      return false;
    }
  },

  /**
   * Generate embeddings for all entries in a knowledge base
   */
  generateEmbeddingsForKnowledgeBase: async (
    knowledgeBaseId: string,
    force: boolean = false,
    onlyUnindexed: boolean = true
  ): Promise<{
    success: boolean;
    processed?: number;
    successful?: number;
    total?: number;
  }> => {
    try {
      const response = await vectorSearchApi.generateEmbeddingsForKnowledgeBase(
        knowledgeBaseId,
        {
          force,
          only_unindexed: onlyUnindexed
        }
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to generate embeddings for knowledge base"
        );
      }

      return {
        success: true,
        processed: response.data?.processed,
        successful: response.data?.successful,
        total: response.data?.total
      };
    } catch (error) {
      logger.error(
        `Error generating embeddings for knowledge base ${knowledgeBaseId}:`,
        error
      );
      return { success: false };
    }
  },

  /**
   * Chunk an entry into smaller pieces for better semantic search
   */
  chunkEntry: async (
    entryId: string,
    force: boolean = false
  ): Promise<{
    success: boolean;
    chunks?: number;
  }> => {
    try {
      const response = await vectorSearchApi.chunkEntry(entryId, { force });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to chunk entry");
      }

      return {
        success: true,
        chunks: response.data?.chunks_created
      };
    } catch (error) {
      logger.error(`Error chunking entry ${entryId}:`, error);
      return { success: false };
    }
  },

  /**
   * Process all entries in a knowledge base for chunking
   */
  processKnowledgeBaseChunking: async (
    knowledgeBaseId: string,
    force: boolean = false
  ): Promise<{
    success: boolean;
    processed?: number;
    total?: number;
  }> => {
    try {
      const response = await vectorSearchApi.processKnowledgeBaseChunking(
        knowledgeBaseId,
        { force }
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to process knowledge base for chunking"
        );
      }

      return {
        success: true,
        processed: response.data?.processed,
        total: response.data?.total
      };
    } catch (error) {
      logger.error(
        `Error processing knowledge base ${knowledgeBaseId} for chunking:`,
        error
      );
      return { success: false };
    }
  },

  /**
   * Update vector search settings for a knowledge base
   */
  updateVectorSearchSettings: async (
    knowledgeBaseId: string,
    settings: VectorSearchSettings
  ): Promise<boolean> => {
    try {
      const response = await vectorSearchApi.updateVectorSearchSettings(
        knowledgeBaseId,
        settings
      );

      if (!response.success) {
        throw new Error(
          response.error?.message ||
            "Failed to update vector search settings"
        );
      }

      return true;
    } catch (error) {
      logger.error(
        `Error updating vector search settings for knowledge base ${knowledgeBaseId}:`,
        error
      );
      return false;
    }
  },

  /**
   * Process a knowledge base for both chunking and embedding generation
   * This is a convenience method that combines multiple operations
   */
  processKnowledgeBase: async (
    knowledgeBaseId: string,
    force: boolean = false
  ): Promise<{
    success: boolean;
    chunking: { processed: number; total: number };
    embeddings: { processed: number; successful: number; total: number };
  }> => {
    try {
      // First chunk the content
      const chunkingResult = await vectorSearchService.processKnowledgeBaseChunking(
        knowledgeBaseId,
        force
      );

      if (!chunkingResult.success) {
        throw new Error("Failed to process chunking");
      }

      // Then generate embeddings
      const embeddingsResult = await vectorSearchService.generateEmbeddingsForKnowledgeBase(
        knowledgeBaseId,
        force
      );

      if (!embeddingsResult.success) {
        throw new Error("Failed to generate embeddings");
      }

      return {
        success: true,
        chunking: {
          processed: chunkingResult.processed || 0,
          total: chunkingResult.total || 0
        },
        embeddings: {
          processed: embeddingsResult.processed || 0,
          successful: embeddingsResult.successful || 0,
          total: embeddingsResult.total || 0
        }
      };
    } catch (error) {
      logger.error(
        `Error processing knowledge base ${knowledgeBaseId}:`,
        error
      );
      return {
        success: false,
        chunking: { processed: 0, total: 0 },
        embeddings: { processed: 0, successful: 0, total: 0 }
      };
    }
  }
};

export default vectorSearchService; 