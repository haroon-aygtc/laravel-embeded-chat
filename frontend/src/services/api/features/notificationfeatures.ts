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

export interface WebSocketConnectionOptions {
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    onMessage?: (data: any) => void;
    onNotification?: (notification: Notification) => void;
}

/**
 * WebSocket connection management for notifications
 */
class WebSocketManager {
    private socket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private userId: string | null = null;
    private options: WebSocketConnectionOptions = {};

    /**
     * Initialize WebSocket connection
     * @param userId The user ID to subscribe notifications for
     * @param options Connection options including callbacks
     * @returns Promise that resolves when connection is established or rejects on error
     */
    public connect(userId: string, options: WebSocketConnectionOptions = {}): Promise<void> {
        if (!userId) return Promise.reject(new Error('User ID is required'));

        this.userId = userId;
        this.options = options;

        if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
        if (this.isConnecting) return this.waitForConnection();

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = import.meta.env.VITE_API_WS_HOST || window.location.host;
                const wsUrl = `${protocol}//${host}${notificationEndpoints.wsNotifications(userId)}`;

                const socket = new WebSocket(wsUrl);
                this.socket = socket;

                socket.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.isConnecting = false;
                    console.log('WebSocket connection established');
                    if (this.options.onOpen) this.options.onOpen();
                    resolve();
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (this.options.onMessage) {
                            this.options.onMessage(data);
                        }

                        if (data.type === 'notification' && this.options.onNotification) {
                            this.options.onNotification(data.notification);
                        }
                    } catch (error) {
                        console.error('Error processing WebSocket message:', error);
                    }
                };

                socket.onclose = (event) => {
                    this.isConnecting = false;

                    if (this.options.onClose) {
                        this.options.onClose(event);
                    }

                    if (!event.wasClean) {
                        console.warn(`WebSocket connection closed unexpectedly. Code: ${event.code}`);
                        this.scheduleReconnect();
                    } else {
                        console.log('WebSocket connection closed cleanly');
                    }
                };

                socket.onerror = (error) => {
                    this.isConnecting = false;
                    console.error('WebSocket error:', error);

                    if (this.options.onError) {
                        this.options.onError(error);
                    }

                    reject(new Error('WebSocket connection error'));
                };
            } catch (error) {
                this.isConnecting = false;
                console.error('Failed to initialize WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Close the WebSocket connection
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.close(1000, 'Client disconnected');
            this.socket = null;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.userId = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Check if the WebSocket connection is active
     */
    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    /**
     * Wait for an in-progress connection to complete
     */
    private waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (!this.isConnecting) {
                    clearInterval(checkInterval);
                    if (this.socket?.readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        reject(new Error('Connection failed'));
                    }
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (this.isConnecting) {
                    this.isConnecting = false;
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Schedule reconnection attempt with exponential backoff
     */
    private scheduleReconnect(): void {
        if (!this.userId) return;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const maxReconnectAttempts = 10;
        if (this.reconnectAttempts >= maxReconnectAttempts) {
            console.error('Maximum reconnect attempts reached');
            return;
        }

        const baseDelay = 1000; // 1 second
        const delay = baseDelay * Math.pow(2, this.reconnectAttempts);
        const jitter = Math.random() * 1000; // Add random jitter
        const reconnectDelay = Math.min(delay + jitter, 30000); // Max 30 seconds

        console.log(`Scheduling reconnect in ${Math.round(reconnectDelay / 1000)} seconds`);

        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${maxReconnectAttempts})`);
            this.connect(this.userId!, this.options).catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, reconnectDelay);
    }
}

// Initialize WebSocket manager
const webSocketManager = new WebSocketManager();

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
            await webSocketManager.connect(userId, options);
            return true;
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            return false;
        }
    },

    /**
     * Disconnect from WebSocket
     */
    disconnectFromWebSocket: (): void => {
        webSocketManager.disconnect();
    },

    /**
     * Check if WebSocket is connected
     */
    isWebSocketConnected: (): boolean => {
        return webSocketManager.isConnected();
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
        pollingInterval: number = 30000
    ): () => void => {
        if (!userId) return () => { };

        let pollTimer: NodeJS.Timeout | null = null;
        let lastNotificationTimestamp = new Date().toISOString();

        // Try WebSocket connection first
        notificationApi.connectToWebSocket(userId, {
            onNotification: callback,
            onError: () => {
                // Fallback to polling if WebSocket fails
                console.log('WebSocket connection failed, falling back to polling');
                startPolling();
            },
            onClose: (event) => {
                if (!event.wasClean) {
                    startPolling();
                }
            }
        }).then(success => {
            if (!success) {
                startPolling();
            }
        });

        // Polling fallback function
        const startPolling = () => {
            if (pollTimer) clearInterval(pollTimer);

            // Initial poll
            pollForNotifications();

            // Set up regular polling
            pollTimer = setInterval(pollForNotifications, pollingInterval);
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
                console.error('Error polling for notifications:', error);
            }
        };

        // Return unsubscribe function
        return () => {
            // Clean up WebSocket
            notificationApi.disconnectFromWebSocket();

            // Clean up polling timer
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        };
    }
}; 