/**
 * AI API Service
 *
 * This service provides methods for interacting with AI endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { aiEndpoints } from "../endpoints/aiEndpoints";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens: number;
  isAvailable: boolean;
}

export interface GenerateRequest {
  query: string;
  contextRuleId?: string;
  promptTemplateId?: string;
  userId: string;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  additionalParams?: Record<string, any>;
}

export interface GenerateResponse {
  content: string;
  modelUsed: string;
  metadata?: Record<string, any>;
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
}

export interface AIInteractionLog {
  id: string;
  userId: string;
  query: string;
  response: string;
  modelUsed: string;
  contextRuleId?: string;
  contextRule?: {
    name: string;
  };
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface LogQueryParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  modelUsed?: string;
  contextRuleId?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
}

export interface LogsResponse {
  logs: AIInteractionLog[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface PerformanceMetrics {
  modelUsage: Array<{ model: string; count: number }>;
  avgResponseTimes: Array<{ model: string; avgTime: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
  timeRange: string;
  contextUsage?: Array<{
    name: string;
    count: number;
    effectiveness?: number
  }>;
}

export interface AICompletionRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: {
    systemPrompt?: string;
    [key: string]: any;
  };
  contextRuleId?: string;
  knowledgeBaseIds?: string[];
  metadata?: Record<string, any>;
}

export interface AICompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIStreamChunk {
  text: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  isPublic: boolean;
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const aiApi = {
  /**
   * Generate a response using AI
   */
  generate: async (
    request: GenerateRequest
  ): Promise<ApiResponse<GenerateResponse>> => {
    return api.post<GenerateResponse>(aiEndpoints.generate, request);
  },

  /**
   * Generate a response using AI with streaming
   * This returns a ReadableStream for processing chunks
   */
  generateStream: async (
    request: GenerateRequest
  ): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch(`${api.getBaseUrl()}${aiEndpoints.streamGenerate}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    return response.body as ReadableStream<Uint8Array>;
  },

  /**
   * Get available AI models
   */
  getModels: async (): Promise<ApiResponse<AIModel[]>> => {
    return api.get<AIModel[]>(aiEndpoints.models);
  },

  /**
   * Get a specific AI model by ID
   */
  getModelById: async (id: string): Promise<ApiResponse<AIModel>> => {
    return api.get<AIModel>(aiEndpoints.modelById(id));
  },

  /**
   * Set the default AI model
   */
  setDefaultModel: async (
    modelId: string
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post<{ success: boolean }>(aiEndpoints.defaultModel, { modelId });
  },

  /**
   * Get the default AI model
   */
  getDefaultModel: async (): Promise<ApiResponse<AIModel>> => {
    return api.get<AIModel>(aiEndpoints.defaultModel);
  },

  /**
   * Get AI interaction logs
   */
  getLogs: async (
    params: LogQueryParams = {}
  ): Promise<ApiResponse<LogsResponse>> => {
    return api.get<LogsResponse>(aiEndpoints.logs, { params });
  },

  /**
   * Get a specific AI interaction log
   */
  getLogById: async (id: string): Promise<ApiResponse<AIInteractionLog>> => {
    return api.get<AIInteractionLog>(aiEndpoints.logById(id));
  },

  /**
   * Log an AI interaction
   */
  logInteraction: async (data: {
    userId: string;
    query: string;
    response: string;
    modelUsed: string;
    contextRuleId?: string;
    knowledgeBaseResults?: number;
    knowledgeBaseIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{ id: string }>> => {
    return api.post<{ id: string }>(aiEndpoints.logs, data);
  },

  /**
   * Get AI performance metrics
   */
  getPerformance: async (
    timeRange: string = "7d"
  ): Promise<ApiResponse<PerformanceMetrics>> => {
    return api.get<PerformanceMetrics>(aiEndpoints.performance, {
      params: { timeRange },
    });
  },

  /**
   * Get AI response cache
   */
  getCache: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(aiEndpoints.cache);
  },

  /**
   * Get a specific AI cache item
   */
  getCacheItem: async (id: string): Promise<ApiResponse<any>> => {
    return api.get<any>(aiEndpoints.cacheItem(id));
  },

  /**
   * Clear the AI response cache
   */
  clearCache: async (): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post<{ success: boolean }>(aiEndpoints.clearCache);
  },

  /**
   * Get prompt templates
   */
  getPromptTemplates: async (): Promise<ApiResponse<PromptTemplate[]>> => {
    return api.get<PromptTemplate[]>(aiEndpoints.promptTemplates);
  },

  /**
   * Get a specific prompt template
   */
  getPromptTemplateById: async (id: string): Promise<ApiResponse<PromptTemplate>> => {
    return api.get<PromptTemplate>(aiEndpoints.promptTemplateById(id));
  },

  /**
   * Create a prompt template
   */
  createPromptTemplate: async (data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PromptTemplate>> => {
    return api.post<PromptTemplate>(aiEndpoints.promptTemplates, data);
  },

  /**
   * Update a prompt template
   */
  updatePromptTemplate: async (
    id: string,
    data: Partial<PromptTemplate>
  ): Promise<ApiResponse<PromptTemplate>> => {
    return api.put<PromptTemplate>(aiEndpoints.promptTemplateById(id), data);
  },

  /**
   * Delete a prompt template
   */
  deletePromptTemplate: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(aiEndpoints.promptTemplateById(id));
  },

  /**
   * Apply a prompt template with variables
   */
  applyTemplate: async (
    id: string,
    variables: Record<string, string>
  ): Promise<ApiResponse<{ prompt: string }>> => {
    return api.post<{ prompt: string }>(`${aiEndpoints.promptTemplateById(id)}/apply`, { variables });
  },
};
