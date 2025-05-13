/**
 * Authentication API Endpoints
 *
 * Defines the API endpoints for authentication operations
 */

export const authEndpoints = {
  // Authentication endpoints
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  refreshToken: "/auth/refresh-token",
  me: "/auth/me",

  // Password management
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  changePassword: "/auth/change-password",

  // Email verification
  verifyEmail: "/auth/verify-email",
  resendVerification: "/auth/resend-verification",

  // Session management
  sessions: "/auth/sessions",
  revokeSession: (sessionId: string) => `/auth/sessions/${sessionId}/revoke`,
};
