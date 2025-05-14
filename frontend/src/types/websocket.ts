/**
 * WebSocket Types
 */

export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting',
    FAILED = 'failed'
}

export interface WebSocketConfig {
    url: string;
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    heartbeatIntervalMs: number;
    heartbeatTimeoutMs: number;
    maxQueueSize: number;
    debug: boolean;
    connectionTimeout: number;
    rateLimitPerSecond: number;
}

export interface WebSocketStats {
    connectionState: ConnectionState;
    queuedMessages: number;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    isConnected: boolean;
    messageRatePerMinute: number;
    latency?: number;
} 