/**
 * Follow-up Questions API Endpoints
 * Defines the API endpoints for follow-up questions operations
 */
export const followUpQuestionEndpoints = {
  getByConfigId: (configId: string) => `/follow-up-questions/${configId}`,
  create: "/follow-up-questions",
  update: (id: string) => `/follow-up-questions/${id}`,
  delete: (id: string) => `/follow-up-questions/${id}`,
  reorder: (configId: string) => `/follow-up-questions/${configId}/reorder`,
  getForChat: (configId: string) => `/follow-up-questions/${configId}/chat`,
};
