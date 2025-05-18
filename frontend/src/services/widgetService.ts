import axios from 'axios';
import apiClient from '@/services/api/core/apiClient';
import { widgetEndpoints } from '@/services/api/endpoints/widgetEndpoints';
import {
    Widget,
    CreateWidgetRequest,
    UpdateWidgetRequest,
    EmbedType,
    WidgetAnalytics,
    DomainValidation
} from '@/types/widget';

export interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export const widgetService = {
    /**
     * Get all widgets
     */
    async getAllWidgets(): Promise<ApiResponse<Widget[]>> {
        try {
            const response = await apiClient.get(widgetEndpoints.getAllWidgets);
            return {
                status: 'success',
                data: response.data.data || [],
                message: response.data.message || 'Widgets retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error fetching widgets:', error);
            return {
                status: 'error',
                data: [],
                message: error.response?.data?.message || 'Failed to retrieve widgets'
            };
        }
    },

    /**
     * Get widget by ID
     */
    async getWidgetById(id: string): Promise<ApiResponse<Widget>> {
        try {
            const response = await apiClient.get(widgetEndpoints.getWidgetById(id));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error fetching widget:', error);
            return {
                status: 'error',
                data: {} as Widget,
                message: error.response?.data?.message || 'Failed to retrieve widget'
            };
        }
    },

    /**
     * Create new widget
     */
    async createWidget(widget: CreateWidgetRequest): Promise<ApiResponse<Widget>> {
        try {
            const response = await apiClient.post(widgetEndpoints.createWidget, widget);
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget created successfully'
            };
        } catch (error: any) {
            console.error('Error creating widget:', error);
            return {
                status: 'error',
                data: {} as Widget,
                message: error.response?.data?.message || 'Failed to create widget'
            };
        }
    },

    /**
     * Update existing widget
     */
    async updateWidget(id: string, widget: UpdateWidgetRequest): Promise<ApiResponse<Widget>> {
        try {
            const response = await apiClient.put(widgetEndpoints.updateWidget(id), widget);
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget updated successfully'
            };
        } catch (error: any) {
            console.error('Error updating widget:', error);
            return {
                status: 'error',
                data: {} as Widget,
                message: error.response?.data?.message || 'Failed to update widget'
            };
        }
    },

    /**
     * Delete widget
     */
    async deleteWidget(id: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await apiClient.delete(widgetEndpoints.deleteWidget(id));
            return {
                status: 'success',
                data: { success: true },
                message: response.data.message || 'Widget deleted successfully'
            };
        } catch (error: any) {
            console.error('Error deleting widget:', error);
            return {
                status: 'error',
                data: { success: false },
                message: error.response?.data?.message || 'Failed to delete widget'
            };
        }
    },

    /**
     * Generate embed code for a widget
     */
    async generateEmbedCode(widgetId: string, type: EmbedType = 'script'): Promise<ApiResponse<{ embed_code: string }>> {
        try {
            const response = await apiClient.get(widgetEndpoints.getEmbedCode(widgetId, type));
            return {
                status: 'success',
                data: response.data.data || { embed_code: '' },
                message: response.data.message || 'Embed code generated successfully'
            };
        } catch (error: any) {
            console.error('Error generating embed code:', error);
            return {
                status: 'error',
                data: { embed_code: '' },
                message: error.response?.data?.message || 'Failed to generate embed code'
            };
        }
    },

    /**
     * Validate domain for widget embedding
     */
    async validateDomain(widgetId: string, domain: string): Promise<ApiResponse<DomainValidation>> {
        try {
            const response = await apiClient.post(widgetEndpoints.validateDomain(widgetId, domain), { domain });
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Domain validated successfully'
            };
        } catch (error: any) {
            console.error('Error validating domain:', error);
            return {
                status: 'error',
                data: { isAllowed: false, domain },
                message: error.response?.data?.message || 'Failed to validate domain'
            };
        }
    },

    /**
     * Add allowed domain for widget
     */
    async addAllowedDomain(widgetId: string, domain: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await apiClient.post(widgetEndpoints.addAllowedDomain(widgetId), { domain });
            return {
                status: 'success',
                data: { success: true },
                message: response.data.message || 'Domain added successfully'
            };
        } catch (error: any) {
            console.error('Error adding domain:', error);
            return {
                status: 'error',
                data: { success: false },
                message: error.response?.data?.message || 'Failed to add domain'
            };
        }
    },

    /**
     * Remove allowed domain from widget
     */
    async removeAllowedDomain(widgetId: string, domain: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await apiClient.delete(widgetEndpoints.removeAllowedDomain(widgetId, domain));
            return {
                status: 'success',
                data: { success: true },
                message: response.data.message || 'Domain removed successfully'
            };
        } catch (error: any) {
            console.error('Error removing domain:', error);
            return {
                status: 'error',
                data: { success: false },
                message: error.response?.data?.message || 'Failed to remove domain'
            };
        }
    },

    /**
     * Get widget analytics
     */
    async getWidgetAnalytics(widgetId: string, timeRange: '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse<WidgetAnalytics>> {
        try {
            const response = await apiClient.get(widgetEndpoints.getWidgetAnalytics(widgetId, timeRange));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Analytics retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting analytics:', error);
            return {
                status: 'error',
                data: {} as WidgetAnalytics,
                message: error.response?.data?.message || 'Failed to retrieve analytics'
            };
        }
    },

    /**
     * Toggle widget active status
     */
    async toggleWidgetStatus(widgetId: string): Promise<ApiResponse<Widget>> {
        try {
            const response = await apiClient.post(widgetEndpoints.toggleWidgetStatus(widgetId));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget status updated successfully'
            };
        } catch (error: any) {
            console.error('Error toggling widget status:', error);
            return {
                status: 'error',
                data: {} as Widget,
                message: error.response?.data?.message || 'Failed to update widget status'
            };
        }
    }
};

export default widgetService; 