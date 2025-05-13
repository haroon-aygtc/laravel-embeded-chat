/**
 * Context Rules Service
 *
 * This service handles interactions with context rules using the API layer
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface ContextRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditions: {
    type: string;
    value: string;
    operator: string;
  }[];
  actions: {
    type: string;
    value: string;
    parameters?: Record<string, any>;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextRulesResponse {
  rules: ContextRule[];
  totalCount: number;
}

/**
 * Service for managing context rules using the API layer
 */
const contextRulesService = {
  /**
   * Get all context rules
   * @param limit - Maximum number of rules to return
   * @param offset - Offset for pagination
   * @param includeInactive - Whether to include inactive rules
   * @returns Promise<ContextRulesResponse>
   */
  getContextRules: async (
    limit: number = 50,
    offset: number = 0,
    includeInactive: boolean = false,
  ): Promise<ContextRulesResponse> => {
    try {
      const response = await api.get<ContextRulesResponse>("/context-rules", {
        params: { limit, offset, includeInactive },
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch context rules",
        );
      }

      return response.data || { rules: [], totalCount: 0 };
    } catch (error) {
      logger.error("Error in getContextRules:", error);
      throw error;
    }
  },

  /**
   * Get a context rule by ID
   * @param ruleId - The ID of the rule
   * @returns Promise<ContextRule | null>
   */
  getContextRuleById: async (ruleId: string): Promise<ContextRule | null> => {
    try {
      const response = await api.get<ContextRule>(`/context-rules/${ruleId}`);

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message || "Failed to fetch context rule",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error in getContextRuleById for ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new context rule
   * @param rule - The rule to create
   * @returns Promise<ContextRule>
   */
  createContextRule: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContextRule> => {
    try {
      const response = await api.post<ContextRule>("/context-rules", rule);

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create context rule",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error in createContextRule:", error);
      throw error;
    }
  },

  /**
   * Update an existing context rule
   * @param ruleId - The ID of the rule to update
   * @param updates - The updates to apply
   * @returns Promise<ContextRule>
   */
  updateContextRule: async (
    ruleId: string,
    updates: Partial<Omit<ContextRule, "id" | "createdAt" | "updatedAt">>,
  ): Promise<ContextRule> => {
    try {
      const response = await api.put<ContextRule>(
        `/context-rules/${ruleId}`,
        updates,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update context rule",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error in updateContextRule for ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a context rule
   * @param ruleId - The ID of the rule to delete
   * @returns Promise<void>
   */
  deleteContextRule: async (ruleId: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/context-rules/${ruleId}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete context rule",
        );
      }
    } catch (error) {
      logger.error(`Error in deleteContextRule for ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Update rule priorities
   * @param rulePriorities - Object mapping rule IDs to their new priorities
   * @returns Promise<void>
   */
  updateRulePriorities: async (
    rulePriorities: Record<string, number>,
  ): Promise<void> => {
    try {
      const response = await api.put<{ success: boolean }>(
        "/context-rules/priorities",
        { rulePriorities },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to update rule priorities",
        );
      }
    } catch (error) {
      logger.error("Error in updateRulePriorities:", error);
      throw error;
    }
  },

  /**
   * Toggle rule active status
   * @param ruleId - The ID of the rule
   * @param isActive - The new active status
   * @returns Promise<ContextRule>
   */
  toggleRuleStatus: async (
    ruleId: string,
    isActive: boolean,
  ): Promise<ContextRule> => {
    try {
      const response = await api.put<ContextRule>(
        `/context-rules/${ruleId}/status`,
        { isActive },
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to toggle rule status",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error in toggleRuleStatus for ${ruleId}:`, error);
      throw error;
    }
  },
};

export default contextRulesService;
