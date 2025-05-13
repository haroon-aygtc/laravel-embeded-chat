/**
 * Follow-up Configuration API Endpoints
 * Defines the API endpoints for follow-up configuration operations
 */
export const followUpConfigEndpoints = {
  getAll: "/follow-up-config",
  getById: (id: string) => `/follow-up-config/${id}`,
  getByUser: (userId: string) => `/follow-up-config/user/${userId}`,
  getDefault: (userId: string) => `/follow-up-config/user/${userId}/default`,
  create: "/follow-up-config",
  update: (id: string) => `/follow-up-config/${id}`,
  delete: (id: string) => `/follow-up-config/${id}`,
};
