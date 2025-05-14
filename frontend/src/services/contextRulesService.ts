"use client";

/**
 * Context Rules Service
 *
 * This service handles interactions with context rules using the API layer
 * with proper endpoint structure and middleware.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";
import { contextRuleEndpoints } from "./api/endpoints/contextRuleEndpoints";
import type { ContextRule, ContextRulesResponse, ContextRuleTestResult, ContextRuleContent } from "@/types/contextRules";

/**
 * Service for managing context rules
 */
const contextRulesService = {
  /**
   * Get context rules
   * @param pageSize - Number of rules to fetch
   * @param page - Page number (0-indexed)
   * @param includeInactive - Whether to include inactive rules
   * @returns Promise<ContextRulesResponse>
   */
  async getContextRules(
    pageSize = 10,
    page = 0,
    includeInactive = false
  ): Promise<ContextRulesResponse> {
    try {
      const response = await api.get<ContextRulesResponse>(contextRuleEndpoints.rules, {
        params: { pageSize, page, includeInactive },
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch context rules"
        );
      }

      return response.data || { rules: [], total: 0, page: 0, pageSize: 0 };
    } catch (error) {
      logger.error("Error in getContextRules:", error);
      throw error;
    }
  },

  /**
   * Get a context rule by ID
   * @param id - The ID of the rule to fetch
   * @returns Promise<ContextRule | null>
   */
  async getContextRule(id: string): Promise<ContextRule | null> {
    try {
      const response = await api.get<ContextRule>(contextRuleEndpoints.ruleById(id));

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message || "Failed to fetch context rule"
        );
      }

      // Parse the content field if it's a string
      if (response.data && typeof response.data.content === 'string') {
        try {
          const contentParsed = JSON.parse(response.data.content as string) as ContextRuleContent;
          response.data.contentParsed = contentParsed;
        } catch (e) {
          logger.warn(`Failed to parse content for rule ${id}:`, e);
        }
      }

      // Add frontend compatibility fields
      if (response.data) {
        response.data.isActive = response.data.is_active;
        response.data.createdAt = response.data.created_at;
        response.data.updatedAt = response.data.updated_at;
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error in getContextRule for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new context rule
   * @param rule - The rule data
   * @returns Promise<ContextRule>
   */
  async createContextRule(
    rule: {
      name: string;
      description: string;
      is_active?: boolean;
      isActive?: boolean;
      is_public?: boolean;
      tags?: string[];
      conditions?: Array<{type: string; value: string; operator?: string}>;
      instructions?: string;
      useKnowledgeBases?: boolean;
      knowledgeBaseIds?: string[];
      actions?: Array<{
        type: string;
        value: string;
        parameters?: {
          action?: string;
        };
      }>;
      tone?: string;
      preferredModel?: string;
      contextType?: string;
    }
  ): Promise<ContextRule> {
    try {
      // Convert camelCase to snake_case for Laravel API compatibility
      const formattedRule = {
        name: rule.name,
        description: rule.description,
        is_active: rule.isActive || rule.is_active || true,
        is_public: rule.is_public || false,
        tags: rule.tags || [],
        content: JSON.stringify({
          patterns: rule.conditions?.filter(c => c.type === "keyword").map(c => ({
            keyword: c.value,
            description: `Keyword pattern for "${c.value}"`
          })) || [],
          instructions: rule.instructions || "",
          useKnowledgeBase: rule.useKnowledgeBases || false,
          knowledgeBaseIds: rule.knowledgeBaseIds || [],
          responseFilters: rule.actions?.map(a => ({
            type: a.type as "keyword" | "regex" | "semantic",
            value: a.value,
            action: (a.parameters?.action as "block" | "flag" | "modify") || "block"
          })) || [],
          tone: rule.tone || "neutral",
          preferredModelId: rule.preferredModel
        }),
        metadata: {
          knowledge_base_ids: rule.knowledgeBaseIds || [],
          preferred_model_id: rule.preferredModel,
          context_type: rule.contextType || "business"
        },
      };

      const response = await api.post<ContextRule>(contextRuleEndpoints.rules, formattedRule);

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create context rule"
        );
      }

      // Add frontend compatibility fields
      if (response.data) {
        response.data.isActive = response.data.is_active;
        response.data.createdAt = response.data.created_at;
        response.data.updatedAt = response.data.updated_at;
        
        // Parse content if it's a string
        if (typeof response.data.content === 'string') {
          try {
            response.data.contentParsed = JSON.parse(response.data.content);
          } catch (e) {
            logger.warn(`Failed to parse content for new rule:`, e);
          }
        }
      }

      return response.data;
    } catch (error) {
      logger.error("Error in createContextRule:", error);
      throw error;
    }
  },

  /**
   * Update a context rule
   * @param id - The ID of the rule to update
   * @param updates - The rule updates
   * @returns Promise<ContextRule>
   */
  async updateContextRule(
    id: string,
    updates: Partial<ContextRule>
  ): Promise<ContextRule> {
    try {
      // Format updates to match backend expectations
      const formattedUpdates: Record<string, any> = { ...updates };
      
      // Convert camelCase to snake_case
      if (updates.isActive !== undefined) {
        formattedUpdates.is_active = updates.isActive;
        delete formattedUpdates.isActive;
      }
      
      // Handle content field serialization
      if (updates.contentParsed) {
        formattedUpdates.content = JSON.stringify(updates.contentParsed);
        delete formattedUpdates.contentParsed;
      }

      const response = await api.put<ContextRule>(
        contextRuleEndpoints.ruleById(id),
        formattedUpdates
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update context rule"
        );
      }

      // Add frontend compatibility fields
      if (response.data) {
        response.data.isActive = response.data.is_active;
        response.data.createdAt = response.data.created_at;
        response.data.updatedAt = response.data.updated_at;
        
        // Parse content if it's a string
        if (typeof response.data.content === 'string') {
          try {
            response.data.contentParsed = JSON.parse(response.data.content);
          } catch (e) {
            logger.warn(`Failed to parse content for updated rule:`, e);
          }
        }
      }

      return response.data;
    } catch (error) {
      logger.error(`Error in updateContextRule for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a context rule
   * @param id - The ID of the rule to delete
   * @returns Promise<void>
   */
  async deleteContextRule(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean }>(
        contextRuleEndpoints.ruleById(id)
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete context rule"
        );
      }
    } catch (error) {
      logger.error(`Error in deleteContextRule for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Test a rule against a query
   * @param ruleId - The ID of the rule to test
   * @param data - Object containing the query to test
   * @returns Promise<ContextRuleTestResult>
   */
  async testRule(
    ruleId: string, 
    data: { query: string }
  ): Promise<ContextRuleTestResult> {
    try {
      const response = await api.post<ContextRuleTestResult>(
        contextRuleEndpoints.testRule(ruleId), 
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to test context rule"
        );
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error testing rule ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Get knowledge bases associated with a context rule
   */
  async getKnowledgeBases(ruleId: string): Promise<any[]> {
    try {
      const response = await api.get(contextRuleEndpoints.knowledgeBases(ruleId));
      
      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to get knowledge bases for context rule"
        );
      }
      
      return response.data || [];
    } catch (error) {
      logger.error(`Error getting knowledge bases for rule ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Get rule templates
   */
  async getTemplates(): Promise<any[]> {
    try {
      const response = await api.get(contextRuleEndpoints.templates);
      
      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to get context rule templates"
        );
      }
      
      return response.data || [];
    } catch (error) {
      logger.error("Error getting context rule templates:", error);
      throw error;
    }
  },

  /**
   * Get user rules
   */
  async getUserRules(userId: string): Promise<ContextRule[]> {
    try {
      const response = await api.get<ContextRule[]>(contextRuleEndpoints.userRules(userId));
      
      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to get user context rules"
        );
      }
      
      // Process rules for frontend compatibility
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(rule => {
          rule.isActive = rule.is_active;
          rule.createdAt = rule.created_at;
          rule.updatedAt = rule.updated_at;
          
          // Parse content if it's a string
          if (typeof rule.content === 'string') {
            try {
              rule.contentParsed = JSON.parse(rule.content);
            } catch (e) {
              logger.warn(`Failed to parse content for rule ${rule.id}:`, e);
            }
          }
        });
      }
      
      return response.data || [];
    } catch (error) {
      logger.error(`Error getting context rules for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Set default rule
   */
  async setDefaultRule(ruleId: string): Promise<ContextRule> {
    try {
      const response = await api.post<ContextRule>(contextRuleEndpoints.setDefault(ruleId), {});
      
      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to set default context rule"
        );
      }
      
      // Add frontend compatibility fields
      if (response.data) {
        response.data.isActive = response.data.is_active;
        response.data.createdAt = response.data.created_at;
        response.data.updatedAt = response.data.updated_at;
        
        // Parse content if it's a string
        if (typeof response.data.content === 'string') {
          try {
            response.data.contentParsed = JSON.parse(response.data.content);
          } catch (e) {
            logger.warn(`Failed to parse content for rule:`, e);
          }
        }
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error setting default context rule ${ruleId}:`, error);
      throw error;
    }
  }
};

export default contextRulesService;
