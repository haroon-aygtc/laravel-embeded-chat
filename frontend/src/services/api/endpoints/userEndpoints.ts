/**
 * User API Endpoints
 *
 * Defines the API endpoints for user operations
 */

export const userEndpoints = {
  // User management endpoints
  users: "/users",
  userById: (id: string) => `/users/${id}`,

  // User profile endpoints
  profile: "/users/profile",
  updateProfile: "/users/profile",
  uploadAvatar: "/users/profile/avatar",

  // User activity endpoints
  activity: (userId: string) => `/users/${userId}/activity`,
  sessions: (userId: string) => `/users/${userId}/sessions`,

  // User preferences
  preferences: "/users/preferences",

  // User status management
  activate: (userId: string) => `/users/${userId}/activate`,
  deactivate: (userId: string) => `/users/${userId}/deactivate`,
};
