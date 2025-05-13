/**
 * Authentication utilities
 *
 * This module provides utility functions for handling authentication state.
 */

/**
 * Get the authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken");
  };
  
  /**
   * Set the authentication token in localStorage
   */
  export const setAuthToken = (token: string): void => {
    localStorage.setItem("authToken", token);
  };
  
  /**
   * Remove the authentication token from localStorage
   */
  export const removeAuthToken = (): void => {
    localStorage.removeItem("authToken");
  };
  
  /**
   * Check if the user is authenticated
   */
  export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
  };
  
  /**
   * Parse JWT token to get payload
   */
  export const parseToken = (token: string): any => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
  
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing token:", error);
      return null;
    }
  };
  
  /**
   * Check if token is expired
   */
  export const isTokenExpired = (token: string): boolean => {
    const payload = parseToken(token);
    if (!payload || !payload.exp) return true;
  
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  };
  
  /**
   * Get token expiration date
   */
  export const getTokenExpirationDate = (token: string): Date | null => {
    const payload = parseToken(token);
    if (!payload || !payload.exp) return null;
  
    return new Date(payload.exp * 1000); // Convert to milliseconds
  };
  