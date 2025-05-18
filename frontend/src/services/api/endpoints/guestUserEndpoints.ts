/**
 * Guest User API Endpoints
 *
 * Defines the API endpoints for guest user operations
 */

export const guestUserEndpoints = {
  // Guest user management
  createGuestUser: "/public/guest/register",
  getGuestUserBySession: "/public/guest/session",
  getAllGuestUsers: "/guest-users",
  getGuestUser: (id: string) => `/guest-users/${id}`,
  updateGuestUserStatus: (id: string) => `/guest-users/${id}/status`,

  // Guest activity tracking
  logGuestActivity: "/public/guest/activity",
  getGuestActivities: (guestId: string) => `/guest-users/${guestId}/activities`,
};
