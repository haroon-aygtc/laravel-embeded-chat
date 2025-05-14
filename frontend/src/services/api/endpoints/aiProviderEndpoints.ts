/**
 * AI Provider API Endpoints
 *
 * Defines the API endpoints for AI provider operations
 */

export const aiProviderEndpoints = {
  // Provider management
  providers: "/ai/providers",
  providerById: (id: string) => `/ai/providers/${id}`,
  configureProvider: (id: string) => `/ai/providers/${id}/configure`,
  testProvider: (id: string) => `/ai/providers/${id}/test`,
  providerStatus: (id: string) => `/ai/providers/${id}/status`,
  providerModels: (id: string) => `/ai/providers/${id}/models`,
  defaultModel: (id: string) => `/ai/providers/${id}/default-model`,
  
  // Provider-specific endpoints
  openaiModels: "/ai/providers/openai/models",
  anthropicModels: "/ai/providers/anthropic/models",
  geminiModels: "/ai/providers/gemini/models",
  grokModels: "/ai/providers/grok/models",
  huggingfaceModels: "/ai/providers/huggingface/models",
  openrouterModels: "/ai/providers/openrouter/models",
  mistralModels: "/ai/providers/mistral/models",
  deepseekModels: "/ai/providers/deepseek/models",
  cohereModels: "/ai/providers/cohere/models",
  
  // Provider capabilities
  providerCapabilities: (id: string) => `/ai/providers/${id}/capabilities`,
  
  // Provider health check
  providerHealth: (id: string) => `/ai/providers/${id}/health`,
};
