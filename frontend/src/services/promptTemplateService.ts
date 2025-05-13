import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";
import { promptTemplateEndpoints } from "./api/endpoints/promptTemplateEndpoints";

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  category?: string;
  variables?: string[];
  isDefault?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const promptTemplateService = {
  /**
   * Get all prompt templates
   */
  getAllTemplates: async (): Promise<PromptTemplate[]> => {
    try {
      const response = await api.get<PromptTemplate[]>(promptTemplateEndpoints.templates);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch prompt templates",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error fetching prompt templates:", error);
      throw new Error(`Failed to fetch prompt templates: ${error.message}`);
    }
  },

  /**
   * Get a prompt template by ID
   */
  getTemplateById: async (id: string): Promise<PromptTemplate | null> => {
    try {
      const response = await api.get<PromptTemplate>(promptTemplateEndpoints.templateById(id));

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(
          response.error?.message || "Failed to fetch prompt template",
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error fetching prompt template ${id}:`, error);
      throw new Error(`Failed to fetch prompt template: ${error.message}`);
    }
  },

  /**
   * Create a new prompt template
   */
  createTemplate: async (
    template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.post<PromptTemplate>(
        promptTemplateEndpoints.templates,
        template,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to create prompt template",
        );
      }

      return response.data;
    } catch (error) {
      logger.error("Error creating prompt template:", error);
      throw new Error(`Failed to create prompt template: ${error.message}`);
    }
  },

  /**
   * Update a prompt template
   */
  updateTemplate: async (
    id: string,
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.put<PromptTemplate>(
        promptTemplateEndpoints.templateById(id),
        template,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to update prompt template",
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating prompt template ${id}:`, error);
      throw new Error(`Failed to update prompt template: ${error.message}`);
    }
  },

  /**
   * Delete a prompt template
   */
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<boolean>(promptTemplateEndpoints.templateById(id));

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete prompt template",
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting prompt template ${id}:`, error);
      throw new Error(`Failed to delete prompt template: ${error.message}`);
    }
  },

  /**
   * Get templates by user ID
   */
  getUserTemplates: async (userId: string): Promise<PromptTemplate[]> => {
    try {
      const response = await api.get<PromptTemplate[]>(promptTemplateEndpoints.userTemplates(userId));

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch user prompt templates",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error(`Error fetching user templates for ${userId}:`, error);
      throw new Error(`Failed to fetch user templates: ${error.message}`);
    }
  },

  /**
   * Get template categories
   */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>(promptTemplateEndpoints.categories);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch template categories",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error fetching template categories:", error);
      throw new Error(`Failed to fetch template categories: ${error.message}`);
    }
  },

  /**
   * Test a prompt template with variables
   */
  testTemplate: async (id: string, variables: Record<string, string>): Promise<string> => {
    try {
      const response = await api.post<{ result: string }>(
        promptTemplateEndpoints.testTemplate(id),
        { variables }
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to test prompt template",
        );
      }

      return response.data.result;
    } catch (error) {
      logger.error(`Error testing prompt template ${id}:`, error);
      throw new Error(`Failed to test prompt template: ${error.message}`);
    }
  },
};

export default promptTemplateService;
export { promptTemplateService };
