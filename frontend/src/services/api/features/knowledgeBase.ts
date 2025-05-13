/**
 * Knowledge Base API Service (Config & Analytics)
 *
 * This service provides methods for interacting with knowledge base configuration,
 * analytics, and context rules endpoints. For core CRUD operations on knowledge 
 * bases and entries, see knowledgebasefeatures.ts.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { knowledgeBaseEndpoints } from "../endpoints/knowledgeBaseEndpoints";
import type {
  QueryResult,
  KnowledgeBaseQueryRequest,
  KnowledgeBaseQueryLog,
  KnowledgeBaseAnalytics,
  KnowledgeBaseContextRule,
  KnowledgeBaseConfig
} from "../../../types/knowledgeBase";

// Re-export types for backward compatibility
export type {
  QueryResult,
  KnowledgeBaseQueryRequest,
  KnowledgeBaseQueryLog,
  KnowledgeBaseAnalytics,
  KnowledgeBaseContextRule,
  KnowledgeBaseConfig
};

/**
 * Knowledge Base Config & Analytics API
 * 
 * These endpoints are separate from the core CRUD operations in knowledgebasefeatures.ts
 * and focus on configuration, analytics and context rules
 */
export const knowledgeBaseConfigApi = {
  /**
   * Get all knowledge base configurations
   */
  getAllConfigs: async (): Promise<ApiResponse<KnowledgeBaseConfig[]>> => {
    return api.get<KnowledgeBaseConfig[]>(knowledgeBaseEndpoints.configs);
  },

  /**
   * Get a knowledge base configuration by ID
   */
  getConfigById: async (
    id: string,
  ): Promise<ApiResponse<KnowledgeBaseConfig>> => {
    return api.get<KnowledgeBaseConfig>(knowledgeBaseEndpoints.configById(id));
  },

  /**
   * Create a new knowledge base configuration
   */
  createConfig: async (
    config: Omit<KnowledgeBaseConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<KnowledgeBaseConfig>> => {
    return api.post<KnowledgeBaseConfig>(knowledgeBaseEndpoints.configs, config);
  },

  /**
   * Update a knowledge base configuration
   */
  updateConfig: async (
    id: string,
    config: Partial<KnowledgeBaseConfig>,
  ): Promise<ApiResponse<KnowledgeBaseConfig>> => {
    return api.put<KnowledgeBaseConfig>(
      knowledgeBaseEndpoints.configById(id),
      config,
    );
  },

  /**
   * Delete a knowledge base configuration
   */
  deleteConfig: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(knowledgeBaseEndpoints.configById(id));
  },

  /**
   * Query knowledge bases
   */
  query: async (
    params: KnowledgeBaseQueryRequest,
  ): Promise<ApiResponse<QueryResult[]>> => {
    return api.post<QueryResult[]>(knowledgeBaseEndpoints.query, params);
  },

  /**
   * Sync a knowledge base to update its content
   */
  syncKnowledgeBase: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.post<boolean>(knowledgeBaseEndpoints.syncConfig(id));
  },

  /**
   * Log a knowledge base query for analytics
   */
  logQuery: async (params: {
    userId: string;
    query: string;
    contextRuleId?: string;
    knowledgeBaseIds: string[];
    results: number;
  }): Promise<ApiResponse<{ id: string }>> => {
    return api.post<{ id: string }>(knowledgeBaseEndpoints.logs, params);
  },

  /**
   * Get knowledge base query logs
   */
  getQueryLogs: async (
    params: {
      page?: number;
      limit?: number;
      userId?: string;
      contextRuleId?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<
    ApiResponse<{ logs: KnowledgeBaseQueryLog[]; totalCount: number }>
  > => {
    return api.get<{ logs: KnowledgeBaseQueryLog[]; totalCount: number }>(
      knowledgeBaseEndpoints.logs,
      { params },
    );
  },

  /**
   * Get knowledge base analytics
   */
  getAnalytics: async (
    timeRange: string = "7d",
  ): Promise<ApiResponse<KnowledgeBaseAnalytics>> => {
    return api.get<KnowledgeBaseAnalytics>(knowledgeBaseEndpoints.analytics, {
      params: { timeRange },
    });
  },

  /**
   * Get all context rules
   */
  getAllContextRules: async (): Promise<
    ApiResponse<KnowledgeBaseContextRule[]>
  > => {
    return api.get<KnowledgeBaseContextRule[]>(knowledgeBaseEndpoints.contextRules);
  },

  /**
   * Get a context rule by ID
   */
  getContextRuleById: async (
    id: string,
  ): Promise<ApiResponse<KnowledgeBaseContextRule>> => {
    return api.get<KnowledgeBaseContextRule>(
      knowledgeBaseEndpoints.contextRuleById(id),
    );
  },

  /**
   * Create a new context rule
   */
  createContextRule: async (
    rule: Omit<KnowledgeBaseContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<KnowledgeBaseContextRule>> => {
    return api.post<KnowledgeBaseContextRule>(
      knowledgeBaseEndpoints.contextRules,
      rule,
    );
  },

  /**
   * Update a context rule
   */
  updateContextRule: async (
    id: string,
    rule: Partial<KnowledgeBaseContextRule>,
  ): Promise<ApiResponse<KnowledgeBaseContextRule>> => {
    return api.put<KnowledgeBaseContextRule>(
      knowledgeBaseEndpoints.contextRuleById(id),
      rule,
    );
  },

  /**
   * Delete a context rule
   */
  deleteContextRule: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(knowledgeBaseEndpoints.contextRuleById(id));
  },

  /**
   * Test a context rule
   */
  testContextRule: async (
    id: string,
    query: string,
  ): Promise<ApiResponse<QueryResult[]>> => {
    return api.post<QueryResult[]>(
      knowledgeBaseEndpoints.testContextRule(id),
      { query },
    );
  },

  /**
   * Get usage metrics
   */
  getUsage: async (
    timeRange: string = "30d",
  ): Promise<
    ApiResponse<{
      totalQueries: number;
      uniqueUsers: number;
      queriesOverTime: Array<{ date: string; count: number }>;
    }>
  > => {
    return api.get(knowledgeBaseEndpoints.usage, {
      params: { timeRange },
    });
  },
};

// Legacy function exports for backward compatibility
export async function query(params: KnowledgeBaseQueryRequest): Promise<QueryResult[]> {
  const response = await knowledgeBaseConfigApi.query(params);
  return response.data;
}

export async function syncKnowledgeBase(id: string): Promise<boolean> {
  const response = await knowledgeBaseConfigApi.syncKnowledgeBase(id);
  return response.data;
}

export async function getAnalytics(timeRange: string = "7d"): Promise<KnowledgeBaseAnalytics> {
  const response = await knowledgeBaseConfigApi.getAnalytics(timeRange);
  return response.data;
}

export async function getAllContextRules(): Promise<KnowledgeBaseContextRule[]> {
  const response = await knowledgeBaseConfigApi.getAllContextRules();
  return response.data;
}

export async function getContextRuleById(id: string): Promise<KnowledgeBaseContextRule> {
  const response = await knowledgeBaseConfigApi.getContextRuleById(id);
  return response.data;
}

export async function createContextRule(
  rule: Omit<KnowledgeBaseContextRule, "id" | "createdAt" | "updatedAt">
): Promise<KnowledgeBaseContextRule> {
  const response = await knowledgeBaseConfigApi.createContextRule(rule);
  return response.data;
}

export async function updateContextRule(
  id: string,
  rule: Partial<KnowledgeBaseContextRule>
): Promise<KnowledgeBaseContextRule> {
  const response = await knowledgeBaseConfigApi.updateContextRule(id, rule);
  return response.data;
}

export async function deleteContextRule(id: string): Promise<boolean> {
  const response = await knowledgeBaseConfigApi.deleteContextRule(id);
  return response.data;
}

export async function testContextRule(id: string, query: string): Promise<QueryResult[]> {
  const response = await knowledgeBaseConfigApi.testContextRule(id, query);
  return response.data;
}

export async function getUsage(timeRange: string = "30d"): Promise<{
  totalQueries: number;
  uniqueUsers: number;
  queriesOverTime: Array<{ date: string; count: number }>;
}> {
  const response = await knowledgeBaseConfigApi.getUsage(timeRange);
  return response.data;
}

// For backward compatibility
export const knowledgeBaseApi = knowledgeBaseConfigApi;
