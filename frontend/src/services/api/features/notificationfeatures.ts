/**
 * Notification API Service
 *
 * This service provides methods for interacting with notification endpoints.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { notificationEndpoints } from "../endpoints/notificationEndpoints";

export interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    user_id: string;
    type?: string;
    link?: string;
    metadata?: Record<string, any>;
}

export interface UnreadCountResponse {
    count: number;
}

export interface MarkAsReadResponse {
    success: boolean;
    count: number;
}

export interface CreateNotificationRequest {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
    metadata?: Record<string, any>;
}

import websocketService from '../../../services/websocketService';
import logger from '../../../utils/logger';

export interface WebSocketConnectionOptions {
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    onMessage?: (data: any) => void;
    onNotification?: (notification: Notification) => void;
}

// Map to store notification handlers by user ID
const notificationHandlers = new Map<string, (data: any) => void>();

export const notificationApi = {
    /**
     * Get notifications for a user
     */
    getNotifications: async (userId: string, limit: number = 10): Promise<ApiResponse<Notification[]>> => {
        return api.get<Notification[]>(notificationEndpoints.getNotifications, {
            params: { userId, limit }
        });
    },

    /**
     * Get unread notification count for a user
     */
    getUnreadCount: async (userId: string): Promise<ApiResponse<UnreadCountResponse>> => {
        return api.get<UnreadCountResponse>(notificationEndpoints.unreadCount, {
            params: { userId }
        });
    },

    /**
     * Mark specific notifications as read
     */
    markAsRead: async (notificationIds: string[]): Promise<ApiResponse<MarkAsReadResponse>> => {
        return api.post<MarkAsReadResponse>(notificationEndpoints.markAsRead, { notificationIds });
    },

    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead: async (userId: string): Promise<ApiResponse<MarkAsReadResponse>> => {
        return api.post<MarkAsReadResponse>(notificationEndpoints.markAllAsRead, { userId });
    },

    /**
     * Create a new notification
     */
    createNotification: async (data: CreateNotificationRequest): Promise<ApiResponse<Notification>> => {
        return api.post<Notification>(notificationEndpoints.createNotification, data);
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
        return api.delete<{ success: boolean }>(notificationEndpoints.deleteNotification(id));
    },

    /**
     * Connect to WebSocket for real-time notifications
     */
    connectToWebSocket: async (userId: string, options: WebSocketConnectionOptions = {}): Promise<boolean> => {
        try {
            // Configure the WebSocket URL for notifications
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsPort = import.meta.env.VITE_API_WS_PORT || '9001';
            const host = `${import.meta.env.VITE_API_WS_HOST || window.location.hostname}:${wsPort}`;
            const wsUrl = `${protocol}//${host}${notificationEndpoints.wsNotifications(userId)}`;

            // Check if WebSocket server is available
            const apiHost = `${import.meta.env.VITE_API_HOST || window.location.hostname}:${import.meta.env.VITE_API_PORT || '9000'}`;
            const statusResponse = await fetch(`${window.location.protocol}//${apiHost}/api/websocket-status`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });

            const statusData = await statusResponse.json();
            if (!statusData.available) {
                throw new Error('WebSocket server reports as unavailable');
            }

            // Connect to WebSocket using the main service with the correct URL
            websocketService.setUrl(wsUrl);
            websocketService.connect();

            // Register notification handler
            const messageHandler = (message: any) => {
                if (message.type === 'notification' && options.onNotification) {
                    options.onNotification(message.notification);
                }

                if (options.onMessage) {
                    options.onMessage(message);
                }
            };

            // Store the handler for this user
            notificationHandlers.set(userId, messageHandler);
            websocketService.onMessage(messageHandler);

            // Register other callbacks
            if (options.onOpen) {
                websocketService.onConnect(options.onOpen);
            }

            if (options.onClose) {
                websocketService.onDisconnect((event) => {
                    if (options.onClose) options.onClose(event);
                });
            }

            if (options.onError) {
                websocketService.onError(options.onError);
            }

            return true;
        } catch (error) {
            logger.error('Failed to connect to WebSocket:', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    },

    /**
     * Disconnect from WebSocket
     */
    disconnectFromWebSocket: (): void => {
        websocketService.disconnect();
    },

    /**
     * Check if WebSocket is connected
     */
    isWebSocketConnected: (): boolean => {
        return websocketService.isConnected();
    },

    /**
     * Subscribe to real-time notifications with fallback to polling
     * @param userId The user ID to subscribe notifications for
     * @param callback Function to call when a new notification is received
     * @param pollingInterval Optional interval for polling fallback in milliseconds
     * @returns Unsubscribe function to clean up the subscription
     */
    subscribeToNotifications: (
        userId: string,
        callback: (notification: Notification) => void,
        pollingInterval: number = 30000 // Default to 30 seconds
    ): () => void => {
        if (!userId) return () => { };

        let pollTimer: NodeJS.Timeout | null = null;
        let lastNotificationTimestamp = new Date().toISOString();
        let isWebsocketMode = false;
        let isPollingActive = false;
        let isCheckingWebSocket = false;
        let cleanupFunctions: Array<() => void> = [];

        // Don't check WebSocket status more than once per minute
        const wsCheckDebounceTime = 60000; // 1 minute
        let lastWsCheckTime = 0;

        // Try WebSocket connection first, but only if we haven't checked recently
        const tryWebSocketConnection = () => {
            const now = Date.now();
            if (isCheckingWebSocket || now - lastWsCheckTime < wsCheckDebounceTime) {
                // Skip WebSocket check if we checked recently or are currently checking
                startPolling();
                return;
            }

            isCheckingWebSocket = true;
            lastWsCheckTime = now;

            // Create a notification handler that will be called when a notification is received
            const notificationHandler = (message: any) => {
                if (message.type === 'notification' && message.notification) {
                    callback(message.notification);
                }
            };

            // Register the notification handler with the WebSocket service
            const removeMessageHandler = websocketService.onMessage(notificationHandler);
            cleanupFunctions.push(removeMessageHandler);

            // Register error handler
            const removeErrorHandler = websocketService.onError(() => {
                isCheckingWebSocket = false;
                // Fallback to polling if WebSocket fails
                logger.debug('WebSocket connection failed, falling back to polling');
                if (!isWebsocketMode && !isPollingActive) {
                    startPolling();
                }
            });
            cleanupFunctions.push(removeErrorHandler);

            // Register close handler
            const removeCloseHandler = websocketService.onDisconnect((event) => {
                isCheckingWebSocket = false;
                if (!event.wasClean && isWebsocketMode) {
                    logger.debug('WebSocket connection closed unexpectedly, falling back to polling');
                    isWebsocketMode = false;
                    if (!isPollingActive) {
                        startPolling();
                    }
                }
            });
            cleanupFunctions.push(removeCloseHandler);

            // Register connect handler
            const removeConnectHandler = websocketService.onConnect(() => {
                isCheckingWebSocket = false;
                isWebsocketMode = true;
                // If we were polling, stop it
                stopPolling();
            });
            cleanupFunctions.push(removeConnectHandler);

            // Configure the WebSocket URL for notifications
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsPort = import.meta.env.VITE_API_WS_PORT || '9001';
            const host = `${import.meta.env.VITE_API_WS_HOST || window.location.hostname}:${wsPort}`;
            const wsUrl = `${protocol}//${host}${notificationEndpoints.wsNotifications(userId)}`;

            // Set the URL and connect
            websocketService.setUrl(wsUrl);
            websocketService.connect();

            // Check if connection was successful
            setTimeout(() => {
                isCheckingWebSocket = false;
                if (!websocketService.isConnected() && !isPollingActive) {
                    logger.debug('WebSocket connection not established, falling back to polling');
                    startPolling();
                }
            }, 5000); // Give it 5 seconds to connect
        };

        // Start by trying WebSocket
        tryWebSocketConnection();

        // Polling fallback function
        const startPolling = () => {
            if (isPollingActive) return; // Prevent multiple polling loops

            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }

            isPollingActive = true;
            logger.info('Starting notification polling fallback');

            // Initial poll with a small delay to prevent rapid calls
            setTimeout(pollForNotifications, 1000);

            // Set up regular polling
            pollTimer = setInterval(pollForNotifications, pollingInterval);

            // Every 5 minutes, try WebSocket again
            const retryTimer = setInterval(() => {
                if (!isWebsocketMode) {
                    logger.debug('Retrying WebSocket connection');
                    tryWebSocketConnection();
                }
            }, 5 * 60 * 1000);

            // Add cleanup function for the retry timer
            cleanupFunctions.push(() => clearInterval(retryTimer));
        };

        // Stop polling
        const stopPolling = () => {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            isPollingActive = false;
            logger.info('Stopping notification polling');
        };

        // Function to poll for new notifications
        const pollForNotifications = async () => {
            try {
                const response = await notificationApi.getNotifications(userId, 5);

                if (response.success && response.data) {
                    // Filter for new notifications since last check
                    const newNotifications = response.data.filter(
                        notification => !notification.read && notification.created_at > lastNotificationTimestamp
                    );

                    if (newNotifications.length > 0) {
                        // Update timestamp to latest notification
                        const latestTimestamp = newNotifications.reduce(
                            (latest, notification) =>
                                notification.created_at > latest ? notification.created_at : latest,
                            lastNotificationTimestamp
                        );
                        lastNotificationTimestamp = latestTimestamp;

                        // Trigger callback for each new notification
                        newNotifications.forEach(notification => callback(notification));
                    }
                }
            } catch (error) {
                logger.debug('Error polling for notifications:', error instanceof Error ? error : new Error(String(error)));
            }
        };

        // Return unsubscribe function
        return () => {
            // Clean up all registered handlers
            cleanupFunctions.forEach(cleanup => cleanup());
            cleanupFunctions = [];

            // Clean up polling timer
            stopPolling();
        };
    }
};