/**
 * Context Rules API Service
 *
 * This service provides methods for interacting with context rules endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface ContextRule {
  id: string;
  name: string;
  description?: string;
  allowedTopics: string[];
  excludedTopics: string[];
  keywordTriggers: string[];
  responseInstructions?: string;
  preferredModel?: string;
  useKnowledgeBases?: boolean;
  isDefault: boolean;
  userId: string;
  responseFilters?: Array<{
    type: "keyword" | "regex";
    value: string;
    action: "block" | "replace";
    replacement?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TestRuleRequest {
  query: string;
}

export interface TestRuleResponse {
  result: "allowed" | "blocked";
  matches: string[];
  explanation: string;
}

export const contextRulesApi = {
  /**
   * Get all context rules
   */
  getAllRules: async (): Promise<ApiResponse<ContextRule[]>> => {
    return api.get<ContextRule[]>("/context-rules");
  },

  /**
   * Get a context rule by ID
   */
  getRuleById: async (id: string): Promise<ApiResponse<ContextRule>> => {
    return api.get<ContextRule>(`/context-rules/${id}`);
  },

  /**
   * Create a new context rule
   */
  createRule: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<ContextRule>> => {
    return api.post<ContextRule>("/context-rules", rule);
  },

  /**
   * Update a context rule
   */
  updateRule: async (
    id: string,
    rule: Partial<ContextRule>,
  ): Promise<ApiResponse<ContextRule>> => {
    return api.put<ContextRule>(`/context-rules/${id}`, rule);
  },

  /**
   * Delete a context rule
   */
  deleteRule: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/context-rules/${id}`);
  },

  /**
   * Test a context rule against a query
   */
  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<ApiResponse<TestRuleResponse>> => {
    return api.post<TestRuleResponse>(`/context-rules/${ruleId}/test`, {
      query,
    });
  },

  /**
   * Get context rules for a user
   */
  getRulesByUser: async (
    userId: string,
  ): Promise<ApiResponse<ContextRule[]>> => {
    return api.get<ContextRule[]>(`/context-rules/user/${userId}`);
  },

  /**
   * Get the default context rule for a user
   */
  getDefaultRule: async (userId: string): Promise<ApiResponse<ContextRule>> => {
    return api.get<ContextRule>(`/context-rules/user/${userId}/default`);
  },

  /**
   * Set a context rule as default
   */
  setDefaultRule: async (id: string): Promise<ApiResponse<ContextRule>> => {
    return api.post<ContextRule>(`/context-rules/${id}/set-default`);
  },

  /**
   * Validate a context rule
   */
  validateRule: async (
    rule: Partial<ContextRule>,
  ): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> => {
    return api.post<{ valid: boolean; errors?: string[] }>(
      "/context-rules/validate",
      rule,
    );
  },

  /**
   * Get context rule templates
   */
  getTemplates: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>("/context-rules/templates");
  },

  /**
   * Get a context rule template by ID
   */
  getTemplateById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get<any>(`/context-rules/templates/${id}`);
  },

  /**
   * Get knowledge bases associated with a context rule
   */
  getKnowledgeBases: async (ruleId: string): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/context-rules/${ruleId}/knowledge-bases`);
  },

  /**
   * Associate knowledge bases with a context rule
   */
  setKnowledgeBases: async (
    ruleId: string,
    knowledgeBaseIds: string[],
  ): Promise<ApiResponse<boolean>> => {
    return api.post<boolean>(`/context-rules/${ruleId}/knowledge-bases`, {
      knowledgeBaseIds,
    });
  },
};
