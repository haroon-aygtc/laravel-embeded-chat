/**
 * Context Rules API Endpoints
 *
 * Defines the API endpoints for context rules operations
 */

export const contextRuleEndpoints = {
  // Context rule management
  rules: "/context-rules",
  ruleById: (id: string) => `/context-rules/${id}`,
  userRules: (userId: string) => `/context-rules/user/${userId}`,
  defaultRule: (userId: string) => `/context-rules/user/${userId}/default`,
  setDefault: (id: string) => `/context-rules/${id}/set-default`,

  // Testing and validation
  testRule: (id: string) => `/context-rules/${id}/test`,
  validateRule: "/context-rules/validate",

  // Templates
  templates: "/context-rules/templates",
  templateById: (id: string) => `/context-rules/templates/${id}`,

  // Knowledge base integration
  knowledgeBases: (ruleId: string) =>
    `/context-rules/${ruleId}/knowledge-bases`,
};
