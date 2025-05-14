/**
 * @deprecated This file is deprecated and should not be used.
 * Import directly from the appropriate feature modules:
 * - Import API client from '@/services/axiosConfig'
 * - Import auth API from '@/services/api/features/auth'
 * - Import other feature APIs from '@/services/api/features/{feature}'
 */

// This file is kept temporarily to prevent build errors, but should be removed soon.
// All imports should be updated to use the new API services.

// Re-export the new API services to maintain compatibility
export { default as ApiService } from './axiosConfig';
export { default as api } from './axiosConfig';
export { ensureCsrf as getCsrfToken } from './axiosConfig';

// Note: Individual feature APIs should be imported directly from their respective modules
// Example: import { authApi } from "@/services/api/features/auth";
