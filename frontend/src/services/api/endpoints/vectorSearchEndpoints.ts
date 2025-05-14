/**
 * Vector Search Endpoints
 *
 * This module defines endpoints for interacting with the vector search API.
 */

export const vectorSearchEndpoints = {
  /**
   * Perform semantic search using vector similarity
   */
  semanticSearch: '/api/knowledge-base/semantic-search',

  /**
   * Perform hybrid search (combining vector similarity and keyword search)
   */
  hybridSearch: '/api/knowledge-base/hybrid-search',

  /**
   * Generate embeddings for a specific knowledge entry
   */
  generateEmbeddings: (entryId: string) => `/api/knowledge-base/entries/${entryId}/embeddings`,

  /**
   * Generate embeddings for all entries in a knowledge base
   */
  generateEmbeddingsForKnowledgeBase: (knowledgeBaseId: string) => `/api/knowledge-base/${knowledgeBaseId}/generate-embeddings`,

  /**
   * Chunk content for a specific knowledge entry
   */
  chunkEntry: (entryId: string) => `/api/knowledge-base/entries/${entryId}/chunk`,

  /**
   * Process all entries in a knowledge base for chunking
   */
  processKnowledgeBaseChunking: (knowledgeBaseId: string) => `/api/knowledge-base/${knowledgeBaseId}/process-chunking`,

  /**
   * Update vector search settings for a knowledge base
   */
  updateVectorSearchSettings: (knowledgeBaseId: string) => `/api/knowledge-base/${knowledgeBaseId}/vector-settings`,
}; 