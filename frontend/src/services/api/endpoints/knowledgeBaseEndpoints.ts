/**
 * Knowledge Base API Endpoints
 *
 * Defines the API endpoints for knowledge base operations
 */

export const knowledgeBaseEndpoints = {
  // Main knowledge base endpoints
  knowledgeBase: "/knowledge-base",
  knowledgeBaseById: (id: string) => `/knowledge-base/${id}`,
  exportKnowledgeBase: (id: string) => `/knowledge-base/${id}/export`,
  importKnowledgeBase: "/knowledge-base/import",

  // Entry endpoints
  knowledgeBaseEntries: (id: string) => `/knowledge-base/${id}/entries`,
  entriesById: (id: string) => `/knowledge-base/entries/${id}`,
  bulkCreateEntries: (id: string) => `/knowledge-base/${id}/entries/bulk`,
  bulkDeleteEntries: "/knowledge-base/entries/bulk-delete",
  generateEmbeddings: (id: string) => `/knowledge-base/${id}/generate-embeddings`,
  findSimilar: (entryId: string) => `/knowledge-base/entries/${entryId}/similar`,

  // Search endpoints
  search: "/knowledge-base/search",

  // Configuration endpoints
  configs: "/knowledge-base/configs",
  configById: (id: string) => `/knowledge-base/configs/${id}`,
  syncConfig: (id: string) => `/knowledge-base/${id}/sync`,

  // Query endpoints
  query: "/knowledge-base/query",
  logs: "/knowledge-base/logs",

  // Context rules endpoints
  contextRules: "/knowledge-base/context-rules",
  contextRuleById: (id: string) => `/knowledge-base/context-rules/${id}`,
  testContextRule: (id: string) => `/knowledge-base/context-rules/${id}/test`,

  // Analytics endpoints
  analytics: "/knowledge-base/analytics",
  usage: "/knowledge-base/usage"
};

export default knowledgeBaseEndpoints;
