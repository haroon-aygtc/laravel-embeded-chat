/**
 * Prompt Template API Service
 *
 * This service provides methods for interacting with prompt template endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { promptTemplateEndpoints } from "../endpoints/promptTemplateEndpoints";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  variables: string[] | null;
  is_active: boolean;
  is_public: boolean;
  user_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PreviewTemplateRequest {
  template: string;
  variables?: Record<string, string>;
  includeKnowledgeBase?: boolean;
  knowledgeBaseIds?: string[];
}

export interface PreviewTemplateResponse {
  preview: string;
  variablesUsed: string[];
  sampleValues: Record<string, string>;
}

export const promptTemplateApi = {
  /**
   * Get all prompt templates
   */
  getAllTemplates: async (): Promise<ApiResponse<PromptTemplate[]>> => {
    return api.get<PromptTemplate[]>(promptTemplateEndpoints.templates);
  },

  /**
   * Get a prompt template by ID
   */
  getTemplateById: async (id: string): Promise<ApiResponse<PromptTemplate>> => {
    return api.get<PromptTemplate>(promptTemplateEndpoints.templateById(id));
  },

  /**
   * Create a new prompt template
   */
  createTemplate: async (
    template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<PromptTemplate>> => {
    return api.post<PromptTemplate>(promptTemplateEndpoints.templates, template);
  },

  /**
   * Update a prompt template
   */
  updateTemplate: async (
    id: string,
    template: Partial<Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ApiResponse<PromptTemplate>> => {
    return api.put<PromptTemplate>(promptTemplateEndpoints.templateById(id), template);
  },

  /**
   * Delete a prompt template
   */
  deleteTemplate: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(promptTemplateEndpoints.templateById(id));
  },

  /**
   * Get templates by user ID
   */
  getUserTemplates: async (userId: string): Promise<ApiResponse<PromptTemplate[]>> => {
    return api.get<PromptTemplate[]>(promptTemplateEndpoints.userTemplates(userId));
  },

  /**
   * Get template categories
   */
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return api.get<string[]>(promptTemplateEndpoints.categories);
  },

  /**
   * Test a prompt template with variables
   */
  testTemplate: async (
    id: string, 
    variables: Record<string, string>
  ): Promise<ApiResponse<{ result: string }>> => {
    return api.post<{ result: string }>(
      promptTemplateEndpoints.testTemplate(id),
      { variables }
    );
  },

  /**
   * Preview a template with sample variables
   */
  previewTemplate: async (
    data: PreviewTemplateRequest
  ): Promise<ApiResponse<PreviewTemplateResponse>> => {
    return api.post<PreviewTemplateResponse>(`${promptTemplateEndpoints.templates}/preview`, data);
  }
};

export default promptTemplateApi; 