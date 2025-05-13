/**
 * Response Formatting API Endpoints
 * Defines the API endpoints for response formatting operations
 */
export const responseFormattingEndpoints = {
  getAll: "/response-formatting",
  getById: (id: string) => `/response-formatting/${id}`,
  getByUser: (userId: string) => `/response-formatting/user/${userId}`,
  getDefault: (userId: string) => `/response-formatting/user/${userId}/default`,
  create: "/response-formatting",
  update: (id: string) => `/response-formatting/${id}`,
  delete: (id: string) => `/response-formatting/${id}`,
  getTemplates: "/response-formatting/templates",
  getTemplate: (id: string) => `/response-formatting/templates/${id}`,
};
