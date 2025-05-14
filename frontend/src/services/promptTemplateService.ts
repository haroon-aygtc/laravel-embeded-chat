"use client";

import logger from "@/utils/logger";
import { promptTemplateApi, PromptTemplate, PreviewTemplateRequest, PreviewTemplateResponse } from "./api/features/promptTemplatefeatures";

// Re-export the types from the features layer
export type { PromptTemplate, PreviewTemplateRequest, PreviewTemplateResponse };

class PromptTemplateService {
  /**
   * Get all prompt templates
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    try {
      const response = await promptTemplateApi.getAllTemplates();
      
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch prompt templates");
      }
      
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching prompt templates:', error);
      throw error;
    }
  }

  /**
   * Get a prompt template by ID
   */
  async getTemplate(id: string): Promise<PromptTemplate> {
    try {
      const response = await promptTemplateApi.getTemplateById(id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || `Failed to fetch prompt template with ID ${id}`);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching prompt template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new prompt template
   */
  async createTemplate(data: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<PromptTemplate> {
    try {
      const response = await promptTemplateApi.createTemplate(data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to create prompt template");
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error creating prompt template:', error);
      throw error;
    }
  }

  /**
   * Update a prompt template
   */
  async updateTemplate(id: string, data: Partial<Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<PromptTemplate> {
    try {
      const response = await promptTemplateApi.updateTemplate(id, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || `Failed to update prompt template with ID ${id}`);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error updating prompt template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a prompt template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await promptTemplateApi.deleteTemplate(id);
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to delete prompt template with ID ${id}`);
      }
    } catch (error) {
      logger.error(`Error deleting prompt template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get templates by user ID
   */
  async getUserTemplates(userId: string): Promise<PromptTemplate[]> {
    try {
      const response = await promptTemplateApi.getUserTemplates(userId);
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to fetch user templates for ${userId}`);
      }
      
      return response.data || [];
    } catch (error) {
      logger.error(`Error fetching user templates for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await promptTemplateApi.getCategories();
      
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch template categories");
      }
      
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching template categories:', error);
      throw error;
    }
  }

  /**
   * Test a prompt template with variables
   */
  async testTemplate(id: string, variables: Record<string, string>): Promise<string> {
    try {
      const response = await promptTemplateApi.testTemplate(id, variables);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || `Failed to test prompt template ${id}`);
      }
      
      return response.data.result;
    } catch (error) {
      logger.error(`Error testing prompt template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Preview a template with sample variables
   */
  async previewTemplate(data: PreviewTemplateRequest): Promise<PreviewTemplateResponse> {
    try {
      const response = await promptTemplateApi.previewTemplate(data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to preview template");
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error previewing template:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const promptTemplateService = new PromptTemplateService();

export default promptTemplateService;
