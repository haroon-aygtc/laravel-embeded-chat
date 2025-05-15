import { useState, useEffect, useRef, useCallback } from 'react';
import logger from '@/utils/logger';

export interface WebSocketMessage<T = any> {
    type: string;
    data: T;
}

export type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void;

/**
 * Custom hook for WebSocket connections
 */
export default function useWebSocket(url: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const handlerMapRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!url) return;

        try {
            // Close any existing connection
            if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
                socketRef.current.close();
            }

            // Create new WebSocket connection
            const socket = new WebSocket(url);
            socketRef.current = socket;

            // Set up event handlers
            socket.addEventListener('open', () => {
                logger.info('WebSocket connection established');
                setIsConnected(true);
                setError(null);

                // Clear any reconnect timeout
                if (reconnectTimeoutRef.current) {
                    window.clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            });

            socket.addEventListener('close', (event) => {
                logger.info(`WebSocket connection closed: ${event.code} ${event.reason}`);
                setIsConnected(false);

                // Attempt to reconnect after a delay, unless it was a normal closure
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        logger.info('Attempting to reconnect WebSocket...');
                        connect();
                    }, 9000);
                }
            });

            socket.addEventListener('error', (event) => {
                logger.error('WebSocket error:', event);
                setError(new Error('WebSocket connection error'));
            });

            socket.addEventListener('message', (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Handle the Reverb event format 
                    // Reverb sends: { event: "eventName", channel: "channelName", data: {} }
                    if (message.event) {
                        // Process the message through registered handlers
                        const handlers = handlerMapRef.current.get(message.event);

                        if (handlers) {
                            handlers.forEach(handler => {
                                handler({
                                    type: message.event,
                                    data: message.data
                                });
                            });
                        }
                    }
                } catch (err) {
                    logger.error('Error parsing WebSocket message:', err, event.data);
                }
            });
        } catch (err) {
            logger.error('Error creating WebSocket connection:', err);
            setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));

            // Attempt to reconnect after a delay
            reconnectTimeoutRef.current = window.setTimeout(() => {
                logger.info('Attempting to reconnect WebSocket...');
                connect();
            }, 3000);
        }
    }, [url]);

    // Connect on mount or when URL changes
    useEffect(() => {
        connect();

        // Clean up on unmount
        return () => {
            // Close the WebSocket connection
            if (socketRef.current) {
                socketRef.current.close();
            }

            // Clear any reconnect timeout
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    // Send a message to the WebSocket server
    const sendMessage = useCallback((type: string, data: any): boolean => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            logger.error('Cannot send message: WebSocket is not connected');
            return false;
        }

        try {
            const message = JSON.stringify({ event: type, data });
            socketRef.current.send(message);
            return true;
        } catch (err) {
            logger.error('Error sending WebSocket message:', err);
            return false;
        }
    }, []);

    // Subscribe to a specific message type
    const subscribe = useCallback((type: string, handler: MessageHandler) => {
        if (!handlerMapRef.current.has(type)) {
            handlerMapRef.current.set(type, new Set());
        }

        handlerMapRef.current.get(type)!.add(handler);

        // Return an unsubscribe function
        return () => {
            const handlers = handlerMapRef.current.get(type);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    handlerMapRef.current.delete(type);
                }
            }
        };
    }, []);

    // Disconnect from the WebSocket server
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
        }
    }, []);

    return {
        isConnected,
        error,
        sendMessage,
        subscribe,
        connect,
        disconnect
    };
}