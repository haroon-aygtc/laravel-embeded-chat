/**
 * This hook is deprecated. Use the main WebSocket service from websocketService.ts instead.
 *
 * @deprecated Use websocketService from '@/services/websocketService' instead
 */

import { useEffect } from 'react';
import logger from '@/utils/logger';
import websocketService from '@/services/websocketService';

export interface WebSocketMessage<T = any> {
    type: string;
    data: T;
}

export type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void;

/**
 * Custom hook for WebSocket connections
 * @deprecated Use websocketService from '@/services/websocketService' instead
 */
export default function useWebSocket(url: string | null) {
    // Log deprecation warning
    useEffect(() => {
        logger.warn(
            'useWebSocket hook is deprecated. Use websocketService from @/services/websocketService instead.'
        );

        if (url) {
            // Set the URL in the main WebSocket service
            websocketService.setUrl(url);
        }
    }, [url]);

    return {
        isConnected: websocketService.isConnected,
        error: null,
        sendMessage: (type: string, data: any) =>
            websocketService.sendMessage({ type, payload: data }),
        subscribe: (type: string, handler: MessageHandler) =>
            websocketService.onMessage((message) => {
                if (message.type === type) {
                    handler({ type, data: message.payload });
                }
            }),
        connect: () => websocketService.connect(),
        disconnect: () => websocketService.disconnect()
    };
}