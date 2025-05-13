/**
 * AI API Endpoints
 *
 * Defines the API endpoints for AI operations
 */

export const aiEndpoints = {
  // Core AI generation
  generate: "/ai/generate",
  streamGenerate: "/ai/generate/stream",

  // Models
  models: "/ai/models",
  modelById: (id: string) => `/ai/models/${id}`,
  defaultModel: "/ai/models/default",

  // Logging and analytics
  logs: "/ai/logs",
  logById: (id: string) => `/ai/logs/${id}`,
  performance: "/ai/performance",

  // Caching
  cache: "/ai/cache",
  cacheItem: (id: string) => `/ai/cache/${id}`,
  clearCache: "/ai/cache/clear",

  // Prompt templates
  promptTemplates: "/ai/prompt-templates",
  promptTemplateById: (id: string) => `/ai/prompt-templates/${id}`,
};
