import apiService from "./apiService";
import { executeQuery } from "./api/core/mysql";
import logger from "../utils/logger";
import { User } from "../models";

// Centralized admin service for data fetching and operations
const adminService = {
  // Dashboard data
  getDashboardStats: async () => {
    try {
      const analytics = await apiService.analytics.getOverview("week");
      const messagesByDay = await apiService.analytics.getMessagesByDay(7);
      const topQueries = await apiService.analytics.getTopQueries(5);
      const modelUsage = await apiService.analytics.getModelUsage("week");

      return {
        analytics,
        messagesByDay,
        topQueries,
        modelUsage,
      };
    } catch (error) {
      logger.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // User management
  getUsers: async () => {
    try {
      const users = await User.findAll();
      return users;
    } catch (error) {
      logger.error("Error fetching users:", error);
      throw error;
    }
  },

  getUserById: async (id: string) => {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData: any) => {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (id: string, userData: any) => {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      await user.update(userData);
      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      await user.destroy();
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Context rules management
  getContextRules: async () => {
    try {
      const sql = `
        SELECT * FROM context_rules 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `;
      const contextRules = await executeQuery(sql);
      return contextRules;
    } catch (error) {
      logger.error("Error fetching context rules:", error);
      throw error;
    }
  },

  getContextRuleById: async (id: string) => {
    try {
      const sql = `
        SELECT * FROM context_rules 
        WHERE id = ? 
        LIMIT 1
      `;
      const [contextRule] = await executeQuery(sql, [id]);
      if (!contextRule) {
        throw new Error(`Context rule with ID ${id} not found`);
      }
      return contextRule;
    } catch (error) {
      logger.error(`Error fetching context rule ${id}:`, error);
      throw error;
    }
  },

  createContextRule: async (ruleData: any) => {
    try {
      const sql = `
        INSERT INTO context_rules 
        (id, name, description, is_active, context_type, keywords, excluded_topics, 
        prompt_template, response_filters, use_knowledge_bases, knowledge_base_ids, 
        preferred_model, version, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await executeQuery(
        sql,
        [
          ruleData.id,
          ruleData.name,
          ruleData.description || null,
          ruleData.is_active,
          ruleData.context_type,
          JSON.stringify(ruleData.keywords || []),
          JSON.stringify(ruleData.excluded_topics || []),
          ruleData.prompt_template || null,
          JSON.stringify(ruleData.response_filters || []),
          ruleData.use_knowledge_bases || false,
          JSON.stringify(ruleData.knowledge_base_ids || []),
          ruleData.preferred_model || null,
          ruleData.version || 1,
        ],
        "INSERT",
      );

      return await adminService.getContextRuleById(ruleData.id);
    } catch (error) {
      logger.error("Error creating context rule:", error);
      throw error;
    }
  },

  updateContextRule: async (id: string, ruleData: any) => {
    try {
      const sql = `
        UPDATE context_rules 
        SET 
          name = ?, 
          description = ?, 
          is_active = ?, 
          context_type = ?, 
          keywords = ?, 
          excluded_topics = ?, 
          prompt_template = ?, 
          response_filters = ?, 
          use_knowledge_bases = ?, 
          knowledge_base_ids = ?, 
          preferred_model = ?, 
          version = version + 1, 
          updated_at = NOW() 
        WHERE id = ?
      `;

      await executeQuery(
        sql,
        [
          ruleData.name,
          ruleData.description || null,
          ruleData.is_active,
          ruleData.context_type,
          JSON.stringify(ruleData.keywords || []),
          JSON.stringify(ruleData.excluded_topics || []),
          ruleData.prompt_template || null,
          JSON.stringify(ruleData.response_filters || []),
          ruleData.use_knowledge_bases || false,
          JSON.stringify(ruleData.knowledge_base_ids || []),
          ruleData.preferred_model || null,
          id,
        ],
        "UPDATE",
      );

      return await adminService.getContextRuleById(id);
    } catch (error) {
      logger.error(`Error updating context rule ${id}:`, error);
      throw error;
    }
  },

  deleteContextRule: async (id: string) => {
    try {
      const sql = `DELETE FROM context_rules WHERE id = ?`;
      await executeQuery(sql, [id], "DELETE");
      return true;
    } catch (error) {
      logger.error(`Error deleting context rule ${id}:`, error);
      throw error;
    }
  },

  // Prompt templates management
  getPromptTemplates: async () => {
    try {
      const sql = `
        SELECT * FROM prompt_templates 
        ORDER BY created_at DESC
      `;
      const promptTemplates = await executeQuery(sql);
      return promptTemplates;
    } catch (error) {
      logger.error("Error fetching prompt templates:", error);
      throw error;
    }
  },

  getPromptTemplateById: async (id: string) => {
    try {
      const sql = `
        SELECT * FROM prompt_templates 
        WHERE id = ? 
        LIMIT 1
      `;
      const [promptTemplate] = await executeQuery(sql, [id]);
      if (!promptTemplate) {
        throw new Error(`Prompt template with ID ${id} not found`);
      }
      return promptTemplate;
    } catch (error) {
      logger.error(`Error fetching prompt template ${id}:`, error);
      throw error;
    }
  },

  createPromptTemplate: async (templateData: any) => {
    try {
      const sql = `
        INSERT INTO prompt_templates 
        (id, name, description, template_text, variables, category, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await executeQuery(
        sql,
        [
          templateData.id,
          templateData.name,
          templateData.description || null,
          templateData.template_text,
          JSON.stringify(templateData.variables || []),
          templateData.category || "general",
          templateData.is_active || true,
        ],
        "INSERT",
      );

      return await adminService.getPromptTemplateById(templateData.id);
    } catch (error) {
      logger.error("Error creating prompt template:", error);
      throw error;
    }
  },

  updatePromptTemplate: async (id: string, templateData: any) => {
    try {
      const sql = `
        UPDATE prompt_templates 
        SET 
          name = ?, 
          description = ?, 
          template_text = ?, 
          variables = ?, 
          category = ?, 
          is_active = ?, 
          updated_at = NOW() 
        WHERE id = ?
      `;

      await executeQuery(
        sql,
        [
          templateData.name,
          templateData.description || null,
          templateData.template_text,
          JSON.stringify(templateData.variables || []),
          templateData.category || "general",
          templateData.is_active || true,
          id,
        ],
        "UPDATE",
      );

      return await adminService.getPromptTemplateById(id);
    } catch (error) {
      logger.error(`Error updating prompt template ${id}:`, error);
      throw error;
    }
  },

  deletePromptTemplate: async (id: string) => {
    try {
      const sql = `DELETE FROM prompt_templates WHERE id = ?`;
      await executeQuery(sql, [id], "DELETE");
      return true;
    } catch (error) {
      logger.error(`Error deleting prompt template ${id}:`, error);
      throw error;
    }
  },

  // Widget configuration
  getWidgetConfigs: async () => {
    try {
      return await apiService.widgetConfig.getAll();
    } catch (error) {
      console.error("Error fetching widget configurations:", error);
      throw error;
    }
  },

  getWidgetConfigById: async (id: string) => {
    try {
      return await apiService.widgetConfig.getById(id);
    } catch (error) {
      console.error(`Error fetching widget configuration ${id}:`, error);
      throw error;
    }
  },

  // Moderation management
  getModerationQueue: async (status: "pending" | "approved" | "rejected") => {
    try {
      // Using the existing moderationService through a wrapper
      const { getModerationQueue } = await import("./moderationService");
      return getModerationQueue(status);
    } catch (error) {
      console.error(`Error fetching moderation queue (${status}):`, error);
      throw error;
    }
  },

  getModerationRules: async () => {
    try {
      const { getRules } = await import("./moderationService");
      return getRules();
    } catch (error) {
      console.error("Error fetching moderation rules:", error);
      throw error;
    }
  },

  // System settings
  getSystemSettings: async (
    category: string,
    environment: string = "production",
  ) => {
    try {
      return await apiService.systemSettings.getSettings(category, environment);
    } catch (error) {
      console.error(`Error fetching system settings for ${category}:`, error);
      throw error;
    }
  },

  saveSystemSettings: async (
    category: string,
    settings: any,
    environment: string = "production",
  ) => {
    try {
      await apiService.systemSettings.saveSettings(
        category,
        settings,
        environment,
      );
      return true;
    } catch (error) {
      console.error(`Error saving system settings for ${category}:`, error);
      throw error;
    }
  },

  // API key management
  getApiKeys: async () => {
    try {
      // This would be implemented in a real application
      // For now, return mock data
      return [
        { id: "1", name: "Gemini API Key", lastUsed: new Date().toISOString() },
        {
          id: "2",
          name: "Hugging Face API Key",
          lastUsed: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error("Error fetching API keys:", error);
      throw error;
    }
  },
};

export default adminService;
