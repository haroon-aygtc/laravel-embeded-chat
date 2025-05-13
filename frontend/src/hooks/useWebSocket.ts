import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '@/utils/logger';

interface WebSocketOptions {
    reconnectInterval?: number;
    reconnectAttempts?: number;
    autoReconnect?: boolean;
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
}

export interface WebSocketMessage<T = any> {
    type: string;
    data: T;
    timestamp?: string;
    id?: string;
}

type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void;

/**
 * Custom hook for WebSocket connections
 */
function useWebSocket<T = any>(
    url: string | null,
    options: WebSocketOptions = {}
) {
    const {
        reconnectInterval = 3000,
        reconnectAttempts = 5,
        autoReconnect = true,
        onOpen,
        onClose,
        onError,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectCountRef = useRef(0);
    const messageHandlersRef = useRef<Record<string, MessageHandler[]>>({});
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Send a message through the WebSocket
    const sendMessage = useCallback((type: string, data: any) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setError(new Error('WebSocket not connected'));
            return false;
        }

        try {
            const message: WebSocketMessage = {
                type,
                data,
                timestamp: new Date().toISOString()
            };

            socketRef.current.send(JSON.stringify(message));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return false;
        }
    }, []);

    // Subscribe to message types
    const subscribe = useCallback((type: string, handler: MessageHandler) => {
        if (!messageHandlersRef.current[type]) {
            messageHandlersRef.current[type] = [];
        }
        messageHandlersRef.current[type].push(handler);

        // Return unsubscribe function
        return () => {
            if (messageHandlersRef.current[type]) {
                messageHandlersRef.current[type] = messageHandlersRef.current[type].filter(h => h !== handler);
            }
        };
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!url) return;

        // Close existing connection
        if (socketRef.current) {
            socketRef.current.close();
        }

        try {
            logger.info(`Connecting to WebSocket: ${url}`);
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = (event) => {
                logger.info('WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectCountRef.current = 0;
                if (onOpen) onOpen(event);
            };

            socket.onclose = (event) => {
                logger.info(`WebSocket closed: ${event.code} ${event.reason}`);
                setIsConnected(false);
                if (onClose) onClose(event);

                // Handle reconnection
                if (autoReconnect && reconnectCountRef.current < reconnectAttempts) {
                    reconnectCountRef.current += 1;
                    logger.info(`Reconnecting (${reconnectCountRef.current}/${reconnectAttempts})...`);

                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                }
            };

            socket.onerror = (event) => {
                logger.error('WebSocket error:', event);
                setError(new Error('WebSocket connection error'));
                if (onError) onError(event);
            };

            socket.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    // Dispatch to appropriate handlers
                    if (message.type && messageHandlersRef.current[message.type]) {
                        messageHandlersRef.current[message.type].forEach(handler => {
                            handler(message);
                        });
                    }

                    // Dispatch to wildcard handlers
                    if (messageHandlersRef.current['*']) {
                        messageHandlersRef.current['*'].forEach(handler => {
                            handler(message);
                        });
                    }
                } catch (err) {
                    logger.error('Error processing WebSocket message:', err);
                }
            };
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [url, autoReconnect, reconnectAttempts, reconnectInterval, onOpen, onClose, onError]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    // Connect on mount and when URL changes
    useEffect(() => {
        if (url) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [url, connect, disconnect]);

    return {
        isConnected,
        error,
        sendMessage,
        subscribe,
        connect,
        disconnect
    };
}

export default useWebSocket;