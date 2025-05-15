/**
 * Authentication utilities
 *
 * This module provides utility functions for handling authentication state and CSRF tokens.
 */

import { AUTH_USER_KEY } from "@/config/constants";
import logger from "@/utils/logger";
import { env } from "@/config/env";

// This flag prevents multiple concurrent CSRF token fetches
let isRequestingCsrfToken = false;
let csrfPromise: Promise<void> | null = null;
const CSRF_TIMESTAMP_KEY = 'csrf_fetch_timestamp';
const CSRF_MIN_INTERVAL = 5000; // 5 seconds minimum between fetches

// CRITICAL FIX: Use session/page-level storage instead of a module-level variable
// to prevent the flag from persisting across navigation events
const getCsrfRequestFlag = (): boolean => {
  return sessionStorage.getItem('csrf_requested_flag') === 'true';
};

const setCsrfRequestFlag = (value: boolean): void => {
  sessionStorage.setItem('csrf_requested_flag', value ? 'true' : 'false');
};

const updateCsrfFetchTimestamp = (): void => {
  sessionStorage.setItem(CSRF_TIMESTAMP_KEY, Date.now().toString());
};

/**
 * Get the authenticated user from localStorage
 */
export const getAuthUser = (): any | null => {
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    logger.error("Error parsing auth user:", error);
    return null;
  }
};

/**
 * Set the authenticated user in localStorage
 */
export const setAuthUser = (user: any): void => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

/**
 * Remove any stored auth data
 */
export const removeAuthData = (): void => {
  localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Check if the user is authenticated based on session cookies
 * This now relies on the backend session state rather than localStorage
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // Instead of checking localStorage, we make a lightweight API call
    // to check if the user is authenticated via cookies
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error in isAuthenticated check:", error);
    // If there's any error during authentication check, consider user not authenticated
    return false;
  }
};

/**
 * Check if CSRF token was fetched recently (within timeout period)
 */
const wasCsrfFetchedRecently = (): boolean => {
  const lastFetchTimestamp = sessionStorage.getItem(CSRF_TIMESTAMP_KEY);
  if (!lastFetchTimestamp) return false;

  const now = Date.now();
  const timeSinceLastFetch = now - parseInt(lastFetchTimestamp, 10);
  return timeSinceLastFetch < CSRF_MIN_INTERVAL;
};

/**
 * Get CSRF token from Laravel Sanctum
 * This is required for any stateful requests to Laravel
 *
 * This implementation uses a singleton pattern to absolutely prevent multiple concurrent calls
 */
export const getCsrfToken = async (): Promise<void> => {
  // CRITICAL FIX: If we already requested a token during this page load, just return
  // This is a drastic measure to prevent the infinite loop
  if (getCsrfRequestFlag()) {
    logger.info('CSRF token already requested in this session, preventing additional requests');
    return;
  }

  // Check if CSRF was fetched very recently to prevent rapid calls
  if (wasCsrfFetchedRecently()) {
    logger.debug('CSRF token was fetched recently, skipping redundant fetch');
    return;
  }

  // Check if we already have a valid CSRF token in cookies
  const cookies = document.cookie.split(';');
  const xsrfToken = cookies
    .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (xsrfToken) {
    logger.debug('CSRF token already exists in cookies');
    return;
  }

  // If there's already a request in progress, wait for it to finish
  if (isRequestingCsrfToken) {
    logger.info('CSRF token request already in progress, waiting...');
    if (csrfPromise) {
      return csrfPromise;
    }
  }

  // Set the lock and update timestamps
  isRequestingCsrfToken = true;
  updateCsrfFetchTimestamp();

  // CRITICAL FIX: Set the global flag to prevent future calls
  setCsrfRequestFlag(true);

  // Create a new promise
  csrfPromise = (async () => {
    try {
      // Use the full URL with the correct port (8000 for Laravel)
      const baseUrl = (env.API_BASE_URL || 'http://localhost:9000').replace(/\/api\/?$/, '');
      const csrfUrl = `${baseUrl}/sanctum/csrf-cookie`;

      logger.info('Fetching CSRF token from:', csrfUrl);

      // Simpler fetch request with fewer headers to avoid CORS issues
      const response = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch CSRF cookie: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Verify that the XSRF-TOKEN cookie was actually set
      const updatedCookies = document.cookie.split(';');
      const hasNewXsrfToken = updatedCookies.some(cookie =>
        cookie.trim().startsWith('XSRF-TOKEN=')
      );

      if (!hasNewXsrfToken) {
        logger.warn('XSRF-TOKEN cookie was not set in the response, but no error occurred');
      } else {
        logger.info('CSRF token fetch successful');
      }
    } catch (error) {
      logger.error('❌ Failed to fetch CSRF cookie:', error);
      throw error;
    } finally {
      // Release the lock when done
      isRequestingCsrfToken = false;
    }
  })();

  // Wait for the promise to resolve and return
  return csrfPromise;
};
