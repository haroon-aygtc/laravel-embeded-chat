import { useState, useEffect, useRef, useCallback } from "react";
import logger from '@/utils/logger';
import { WS_BASE_URL } from '@/config/constants';

interface WebSocketOptions {
    reconnectInterval?: number;
    reconnectAttempts?: number;
    autoReconnect?: boolean;
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
    onMessage?: (data: any) => void;
}

export interface WebSocketMessage<T = any> {
    type: string;
    data: T;
    timestamp?: string;
    id?: string;
}

export interface MessageHandler<T> {
    (data: T): void;
}

/**
 * Custom hook for WebSocket communication
 * @param url WebSocket URL to connect to
 * @param options Additional WebSocket options
 */
export default function useWebSocket(url?: string, options: WebSocketOptions = {}) {
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [error, setError] = useState<Event | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectCountRef = useRef(0);

    const {
        reconnectInterval = 2000,
        reconnectAttempts = 5,
        autoReconnect = true,
        onOpen,
        onClose,
        onError,
        onMessage
    } = options;

    /**
     * Send a message through the WebSocket connection
     */
    const sendMessage = useCallback((message: string | object | WebSocketMessage<any>): boolean => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            logger.error("WebSocket not connected");
            return false;
        }

        try {
            const messageStr = typeof message === 'string'
                ? message
                : JSON.stringify(message);

            socketRef.current.send(messageStr);
            return true;
        } catch (err) {
            logger.error("Failed to send message via WebSocket", err);
            return false;
        }
    }, []);

    // Connect to WebSocket
    useEffect(() => {
        if (!url) {
            logger.warn("No WebSocket URL provided");
            return;
        }

        const connectWebSocket = () => {
            try {
                const socket = new WebSocket(url);
                socketRef.current = socket;

                socket.onopen = (event) => {
                    logger.info(`WebSocket connected to ${url}`);
                    setConnected(true);
                    setError(null);
                    reconnectCountRef.current = 0;
                    if (onOpen) onOpen(event);
                };

                socket.onmessage = (event) => {
                    try {
                        // Try to parse as JSON, but fall back to raw data if it fails
                        const data = typeof event.data === 'string'
                            ? JSON.parse(event.data)
                            : event.data;

                        setLastMessage(data);
                        if (onMessage) onMessage(data);
                    } catch (err) {
                        // If JSON parsing fails, use raw data
                        setLastMessage(event.data);
                        if (onMessage) onMessage(event.data);
                    }
                };

                socket.onclose = (event) => {
                    logger.info(`WebSocket disconnected from ${url}`);
                    setConnected(false);
                    if (onClose) onClose(event);

                    // Attempt reconnection if enabled
                    if (autoReconnect &&
                        reconnectCountRef.current < reconnectAttempts &&
                        !event.wasClean) {

                        if (reconnectTimeoutRef.current) {
                            clearTimeout(reconnectTimeoutRef.current);
                        }

                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectCountRef.current += 1;
                            logger.info(`Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})`);
                            connectWebSocket();
                        }, reconnectInterval);
                    }
                };

                socket.onerror = (event) => {
                    logger.error("WebSocket error:", event);
                    setError(event);
                    if (onError) onError(event);
                };
            } catch (err) {
                logger.error("Failed to create WebSocket connection", err);
                if (error) setError(error);
            }
        };

        connectWebSocket();

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [url, reconnectInterval, reconnectAttempts, autoReconnect, onOpen, onClose, onError, onMessage]);

    return {
        connected,
        lastMessage,
        sendMessage,
        error
    };
}