/**
 * Notification Service API Endpoints
 *
 * Defines the API endpoints for notification operations
 */

export const notificationEndpoints = {
    // Core notification functionality
    getNotifications: "/notifications",
    unreadCount: "/notifications/unread-count",
    markAsRead: "/notifications/mark-read",
    markAllAsRead: "/notifications/mark-all-read",
    createNotification: "/notifications",
    deleteNotification: (id: string) => `/notifications/${id}`,

    // WebSocket connection
    wsNotifications: (userId: string) => `/ws/notifications?user=${userId}`,
}; 