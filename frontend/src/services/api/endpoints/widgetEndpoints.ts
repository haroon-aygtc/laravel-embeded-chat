/**
 * Widget API Endpoints
 *
 * Defines the API endpoints for widget operations
 */

import { API_BASE_URL } from '@/config/api';

export const WIDGET_ENDPOINTS = {
  // Admin/Authenticated endpoints
  getAllWidgets: `${API_BASE_URL}/widgets`,
  getWidget: (id: string) => `${API_BASE_URL}/widgets/${id}`,
  createWidget: `${API_BASE_URL}/widgets`,
  updateWidget: (id: string) => `${API_BASE_URL}/widgets/${id}`,
  deleteWidget: (id: string) => `${API_BASE_URL}/widgets/${id}`,
  toggleWidgetStatus: (id: string) => `${API_BASE_URL}/widgets/${id}/toggle-status`,
  generateEmbedCode: (id: string) => `${API_BASE_URL}/widgets/${id}/embed-code`,
  validateDomain: (id: string) => `${API_BASE_URL}/widgets/${id}/validate-domain`,
  
  // Public endpoints
  publicWidgetConfig: (id: string) => `${API_BASE_URL}/public/widgets/${id}/config`,
  createPublicChatSession: (id: string) => `${API_BASE_URL}/public/widgets/${id}/sessions`,
};
