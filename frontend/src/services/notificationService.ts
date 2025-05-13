/**
 * Notification Service
 * 
 * Provides a simplified interface for notification functionality using the notificationApi feature.
 */

import { notificationApi, Notification, WebSocketConnectionOptions } from "./api/features/notificationfeatures";

/**
 * Service to handle real-time notifications and related operations
 */
const notificationService = {
    /**
     * Subscribe to real-time notifications for a specific user
     * @param userId The user ID to subscribe notifications for
     * @param callback Function to call when a new notification is received
     * @returns Unsubscribe function to clean up the subscription
     */
    subscribeToNotifications: (
        userId: string,
        callback: (notification: Notification) => void
    ): () => void => {
        return notificationApi.subscribeToNotifications(userId, callback);
    },

    /**
     * Fetch notifications for a user
     * @param userId The user ID to fetch notifications for
     * @param limit Maximum number of notifications to fetch
     * @returns Promise resolving to an array of notifications
     */
    fetchNotifications: async (userId: string, limit: number = 10): Promise<Notification[]> => {
        try {
            const response = await notificationApi.getNotifications(userId, limit);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    /**
     * Mark notifications as read
     * @param notificationIds Array of notification IDs to mark as read
     * @returns Promise resolving to a boolean indicating success
     */
    markNotificationsAsRead: async (notificationIds: string[]): Promise<boolean> => {
        try {
            const response = await notificationApi.markAsRead(notificationIds);
            return response.success || false;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            return false;
        }
    },

    /**
     * Mark all notifications as read for a user
     * @param userId The user ID to mark all notifications as read for
     * @returns Promise resolving to a boolean indicating success
     */
    markAllNotificationsAsRead: async (userId: string): Promise<boolean> => {
        try {
            const response = await notificationApi.markAllAsRead(userId);
            return response.success || false;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    },

    /**
     * Get unread notification count for a user
     * @param userId The user ID to get unread count for
     * @returns Promise resolving to the number of unread notifications
     */
    getUnreadCount: async (userId: string): Promise<number> => {
        try {
            const response = await notificationApi.getUnreadCount(userId);
            return response.data?.count || 0;
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
            return 0;
        }
    },

    /**
     * Create a new notification
     * @param data Notification data to create
     * @returns Promise resolving to the created notification
     */
    createNotification: async (data: {
        userId: string;
        title: string;
        message: string;
        type?: string;
        link?: string;
        metadata?: Record<string, any>;
    }): Promise<Notification | null> => {
        try {
            const response = await notificationApi.createNotification(data);
            return response.data || null;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    },

    /**
     * Delete a notification
     * @param id The ID of the notification to delete
     * @returns Promise resolving to a boolean indicating success
     */
    deleteNotification: async (id: string): Promise<boolean> => {
        try {
            const response = await notificationApi.deleteNotification(id);
            return response.success || false;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    },

    /**
     * Connect to WebSocket for real-time notifications with custom handlers
     * @param userId The user ID to connect for
     * @param options WebSocket connection options including callbacks
     * @returns Promise resolving to a boolean indicating success
     */
    connectToWebSocket: async (
        userId: string,
        options: WebSocketConnectionOptions = {}
    ): Promise<boolean> => {
        return notificationApi.connectToWebSocket(userId, options);
    },

    /**
     * Disconnect from WebSocket
     */
    disconnectFromWebSocket: (): void => {
        notificationApi.disconnectFromWebSocket();
    },

    /**
     * Check if WebSocket is connected
     */
    isWebSocketConnected: (): boolean => {
        return notificationApi.isWebSocketConnected();
    }
};

export type { Notification };
export default notificationService; 