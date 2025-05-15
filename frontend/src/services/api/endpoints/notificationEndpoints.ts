/**
 * Notification Service API Endpoints
 *
 * Defines the API endpoints for notification operations
 */

export const notificationEndpoints = {
    /**
     * WebSocket endpoint for real-time notifications
     */
    wsNotifications: (userId: string) => `/app/notification?user=${userId}`,

    /**
     * Get notifications for a user
     */
    getNotifications: "/notifications",

    /**
     * Get unread notification count for a user
     */
    unreadCount: "/notifications/unread-count",

    /**
     * Mark notifications as read
     */
    markAsRead: "/notifications/mark-read",

    /**
     * Mark all notifications as read
     */
    markAllAsRead: "/notifications/mark-all-read",

    /**
     * Create a new notification
     */
    createNotification: "/notifications",

    /**
     * Delete a notification
     */
    deleteNotification: (id: string) => `/notifications/${id}`,
}; 