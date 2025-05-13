/**
 * Prompt Template API Endpoints
 *
 * Defines the API endpoints for prompt template operations
 */

export const promptTemplateEndpoints = {
  // Template management
  templates: "/prompt-templates",
  templateById: (id: string) => `/prompt-templates/${id}`,
  userTemplates: (userId: string) => `/prompt-templates/user/${userId}`,

  // Template categories
  categories: "/prompt-templates/categories",
  categoryById: (id: string) => `/prompt-templates/categories/${id}`,

  // Template variables
  variables: "/prompt-templates/variables",

  // Template testing
  testTemplate: (id: string) => `/prompt-templates/${id}/test`,
};
