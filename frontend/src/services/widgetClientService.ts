import axios from 'axios';
import { API_BASE_URL } from '@/services/api/core/apiClient';
import { widgetEndpoints } from './api/endpoints/widgetEndpoints';
import {
    Widget,
    ChatMessage,
    ChatSession
} from '@/types/widget';

/**
 * WidgetClientService
 * 
 * This service handles all API interactions for the embedded widget
 * when used on third-party websites. It uses a dedicated client without
 * authentication headers.
 */

// Create a separate axios instance for public widget usage
// This ensures we don't send auth tokens from the main app
const widgetClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Widget-Client': 'true',
    },
    withCredentials: true, // Send cookies for session management
});

export interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface WidgetConfig {
    id: string;
    title: string;
    subtitle?: string;
    visual_settings: Widget['visual_settings'];
    behavioral_settings: Widget['behavioral_settings'];
    content_settings: Widget['content_settings'];
}

export const widgetClientService = {
    /**
     * Get widget configuration for public widget
     * @param widgetId The ID of the widget to get the configuration for
     * @returns Promise with widget configuration
     */
    async getWidgetConfig(widgetId: string): Promise<ApiResponse<WidgetConfig>> {
        try {
            const response = await widgetClient.get(widgetEndpoints.getWidgetConfig(widgetId));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget configuration retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting widget config:', error);
            return {
                status: 'error',
                data: {} as WidgetConfig,
                message: error.response?.data?.message || 'Failed to retrieve widget configuration'
            };
        }
    },

    /**
     * Create a new chat session for the widget
     * @param widgetId The ID of the widget to create a session for
     * @returns Promise with session ID
     */
    async createChatSession(widgetId: string): Promise<ApiResponse<{ session_id: string; name: string }>> {
        try {
            const response = await widgetClient.post(widgetEndpoints.createChatSession(widgetId));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Chat session created successfully'
            };
        } catch (error: any) {
            console.error('Error creating chat session:', error);
            return {
                status: 'error',
                data: { session_id: '', name: '' },
                message: error.response?.data?.message || 'Failed to create chat session'
            };
        }
    },

    /**
     * Get messages for a chat session
     * @param sessionId The ID of the session to get messages for
     * @param page Page number for pagination
     * @param limit Number of messages per page
     * @returns Promise with chat messages
     */
    async getSessionMessages(
        sessionId: string,
        page = 1,
        limit = 50
    ): Promise<ApiResponse<{ data: ChatMessage[]; pagination: any }>> {
        try {
            const response = await widgetClient.get(widgetEndpoints.getSessionMessages(sessionId, page, limit));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Messages retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting session messages:', error);
            return {
                status: 'error',
                data: { data: [], pagination: {} },
                message: error.response?.data?.message || 'Failed to retrieve messages'
            };
        }
    },

    /**
     * Send a message in a chat session
     * @param sessionId The ID of the session to send the message in
     * @param content The message content
     * @param attachments Optional file attachments
     * @returns Promise with sent message
     */
    async sendMessage(
        sessionId: string,
        content: string,
        attachments?: File[]
    ): Promise<ApiResponse<ChatMessage>> {
        try {
            let response;

            if (attachments && attachments.length > 0) {
                // Handle file uploads
                const formData = new FormData();
                formData.append('content', content);
                attachments.forEach((attachment, index) => {
                    formData.append(`attachments[${index}]`, attachment);
                });

                response = await widgetClient.post(
                    widgetEndpoints.sendMessage(sessionId),
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            } else {
                // Simple text message
                response = await widgetClient.post(widgetEndpoints.sendMessage(sessionId), {
                    content
                });
            }

            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Message sent successfully'
            };
        } catch (error: any) {
            console.error('Error sending message:', error);
            return {
                status: 'error',
                data: {} as ChatMessage,
                message: error.response?.data?.message || 'Failed to send message'
            };
        }
    },

    /**
     * Validate if the widget can be embedded on the current domain
     * @param widgetId The ID of the widget to validate
     * @param domain The domain to validate against
     * @returns Promise with validation result
     */
    async validateDomain(widgetId: string, domain: string): Promise<ApiResponse<{ isAllowed: boolean; domain: string }>> {
        try {
            const response = await widgetClient.post(widgetEndpoints.validateDomain(widgetId, domain), {
                domain
            });
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
     * End a chat session
     * @param sessionId The ID of the session to end
     * @returns Promise with session end result
     */
    async endSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await widgetClient.post(widgetEndpoints.endSession(sessionId));
            return {
                status: 'success',
                data: { success: true },
                message: response.data.message || 'Session ended successfully'
            };
        } catch (error: any) {
            console.error('Error ending session:', error);
            return {
                status: 'error',
                data: { success: false },
                message: error.response?.data?.message || 'Failed to end session'
            };
        }
    },

    /**
     * Provide feedback for a message
     * @param messageId The ID of the message to provide feedback for
     * @param feedback The feedback object containing rating and comment
     * @returns Promise with feedback submission result
     */
    async provideFeedback(
        messageId: string,
        feedback: { rating: number; comment?: string }
    ): Promise<ApiResponse<ChatMessage>> {
        try {
            const response = await widgetClient.post(`/widget-client/messages/${messageId}/feedback`, feedback);
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Feedback submitted successfully'
            };
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            return {
                status: 'error',
                data: {} as ChatMessage,
                message: error.response?.data?.message || 'Failed to submit feedback'
            };
        }
    },


    /**
     * Get the embed code for a widget
     * @param widgetId The ID of the widget to get the embed code for
     * @param type The type of embed code to get
     * @returns Promise with embed code
     */
    async getEmbedCode(widgetId: string, type): Promise<ApiResponse<{ embed_code: string }>> {
        try {
            const response = await widgetClient.get(widgetEndpoints.getEmbedCode(widgetId, type));
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Embed code retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting embed code:', error);
            return {
                status: 'error',
                data: { embed_code: '' },
                message: error.response?.data?.message || 'Failed to retrieve embed code'
            };
        }
    },


    /**
     * Get the widget list
     * @returns Promise with widget list
     */
    async getWidgetList(): Promise<ApiResponse<Widget[]>> {
        try {
            const response = await widgetClient.get(widgetEndpoints.getAllWidgets);
            return {
                status: 'success',
                data: response.data.data,
                message: response.data.message || 'Widget list retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting widget list:', error);
            return {
                status: 'error',
                data: [],
                message: error.response?.data?.message || 'Failed to retrieve widget list'
            };
        }
    },

    async createWidget(widget: Widget): Promise<ApiResponse<Widget>> {
        try {
            const response = await widgetClient.post(widgetEndpoints.createWidget, widget);
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

    async updateWidget(widgetId: string, widget: Widget): Promise<ApiResponse<Widget>> {
        try {
            const response = await widgetClient.put(widgetEndpoints.updateWidget(widgetId), widget);
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

    async deleteWidget(widgetId: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await widgetClient.delete(widgetEndpoints.deleteWidget(widgetId));
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

    async toggleWidgetStatus(widgetId: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const response = await widgetClient.post(widgetEndpoints.toggleWidgetStatus(widgetId));
            return {
                status: 'success',
                data: { success: true },
                message: response.data.message || 'Widget status toggled successfully'
            };
        } catch (error: any) {
            console.error('Error toggling widget status:', error);
            return {
                status: 'error',
                data: { success: false },
                message: error.response?.data?.message || 'Failed to toggle widget status'
            };
        }
    }
};



export default widgetClientService; 