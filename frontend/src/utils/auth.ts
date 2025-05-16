/**
 * Authentication utilities for the frontend
 */

import Cookies from 'js-cookie';

// Constants
const CSRF_TOKEN_KEY = 'XSRF-TOKEN';

/**
 * Get CSRF token from cookies
 */
export const getCsrfToken = async (): Promise<string | undefined> => {
  // First check if we already have a token
  let token = Cookies.get(CSRF_TOKEN_KEY);

  // If no token, fetch one from the server
  if (!token) {
    try {
      const response = await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        // Token should now be in cookies
        token = Cookies.get(CSRF_TOKEN_KEY);
      } else {
        console.error('Failed to fetch CSRF token:', response.status);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  }

  return token;
};

/**
 * Remove CSRF token cookie
 */
export const clearCsrfToken = (): void => {
  Cookies.remove(CSRF_TOKEN_KEY);
};

// All other auth functionality is now handled by AuthService
// This file only contains CSRF token handling for backward compatibility
// New code should use AuthService instead
