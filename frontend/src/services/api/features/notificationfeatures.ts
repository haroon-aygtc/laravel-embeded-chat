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
                // Check if we are in a development environment (localhost)
                const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

                // Get the protocol (ws or wss) based on the current page protocol
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

                // Use the environment variable or fallback to current host
                let host = import.meta.env.VITE_API_WS_HOST || window.location.host;

                // If we're running on localhost and there's no explicit WebSocket host,
                // use a backend-specific port (assuming backend WebSocket runs on 6001)
                if (isLocalhost && !import.meta.env.VITE_API_WS_HOST) {
                    host = `${window.location.hostname}:6001`;
                }

                const wsUrl = `${protocol}//${host}${notificationEndpoints.wsNotifications(userId)}`;

                console.log('Connecting to WebSocket:', wsUrl);

                // Add timeout to abort connection attempt if it takes too long
                const connectionTimeout = setTimeout(() => {
                    if (this.isConnecting) {
                        this.isConnecting = false;
                        console.warn('WebSocket connection attempt timed out');
                        reject(new Error('Connection timeout'));
                    }
                }, 5000);

                // First check if WebSocket server is available with a simple fetch
                // This helps avoid hanging WebSocket connection attempts
                fetch(`${window.location.protocol}//${host}/api/websocket-status`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    mode: 'cors'
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('WebSocket server not available');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (!data.available) {
                            throw new Error('WebSocket server reports as unavailable');
                        }

                        // If we reach here, WebSocket server should be available
                        const socket = new WebSocket(wsUrl);
                        this.socket = socket;

                        socket.onopen = () => {
                            clearTimeout(connectionTimeout);
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
                            clearTimeout(connectionTimeout);
                            this.isConnecting = false;

                            if (this.options.onClose) {
                                this.options.onClose(event);
                            }

                            if (!event.wasClean) {
                                console.debug(`WebSocket connection closed unexpectedly. Code: ${event.code}`);
                                this.scheduleReconnect();
                            } else {
                                console.log('WebSocket connection closed cleanly');
                            }
                        };

                        socket.onerror = (error) => {
                            clearTimeout(connectionTimeout);
                            this.isConnecting = false;
                            console.debug('WebSocket error:', error);

                            if (this.options.onError) {
                                this.options.onError(error);
                            }

                            reject(new Error('WebSocket connection error'));
                        };
                    })
                    .catch(error => {
                        clearTimeout(connectionTimeout);
                        this.isConnecting = false;
                        console.debug('WebSocket server check failed:', error.message);
                        console.debug('Falling back to polling immediately');
                        reject(new Error(`WebSocket server unavailable: ${error.message}`));
                    });
            } catch (error) {
                this.isConnecting = false;
                console.debug('Failed to initialize WebSocket:', error);
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
        pollingInterval: number = 30000 // Default to 30 seconds
    ): () => void => {
        if (!userId) return () => { };

        let pollTimer: NodeJS.Timeout | null = null;
        let lastNotificationTimestamp = new Date().toISOString();
        let isWebsocketMode = false;
        let isPollingActive = false;
        let isCheckingWebSocket = false;

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

            notificationApi.connectToWebSocket(userId, {
                onNotification: callback,
                onError: () => {
                    isCheckingWebSocket = false;
                    // Fallback to polling if WebSocket fails
                    console.debug('WebSocket connection failed, falling back to polling');
                    if (!isWebsocketMode && !isPollingActive) {
                        startPolling();
                    }
                },
                onClose: (event) => {
                    isCheckingWebSocket = false;
                    if (!event.wasClean && isWebsocketMode) {
                        console.debug('WebSocket connection closed unexpectedly, falling back to polling');
                        isWebsocketMode = false;
                        if (!isPollingActive) {
                            startPolling();
                        }
                    }
                },
                onOpen: () => {
                    isCheckingWebSocket = false;
                    isWebsocketMode = true;
                    // If we were polling, stop it
                    stopPolling();
                }
            }).then(success => {
                isCheckingWebSocket = false;
                if (!success && !isPollingActive) {
                    startPolling();
                }
            }).catch(() => {
                isCheckingWebSocket = false;
                // Explicitly handle the rejection
                if (!isPollingActive) {
                    startPolling();
                }
            });
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

            // Initial poll with a small delay to prevent rapid calls
            setTimeout(pollForNotifications, 1000);

            // Set up regular polling
            pollTimer = setInterval(pollForNotifications, pollingInterval);

            // Every 5 minutes, try WebSocket again
            setInterval(() => {
                if (!isWebsocketMode) {
                    tryWebSocketConnection();
                }
            }, 5 * 60 * 1000);
        };

        // Stop polling
        const stopPolling = () => {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            isPollingActive = false;
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
                console.debug('Error polling for notifications:', error);
            }
        };

        // Return unsubscribe function
        return () => {
            // Clean up WebSocket
            notificationApi.disconnectFromWebSocket();

            // Clean up polling timer
            stopPolling();
        };
    }
}; 