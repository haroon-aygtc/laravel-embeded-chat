/**
 * WebSocket Service Module
 *
 * This module re-exports the main WebSocket service from websocketService.ts
 * to maintain backward compatibility.
 */

import websocketService from '../../../services/websocketService';
import { ConnectionState, WebSocketConfig, WebSocketStats } from "../../../types/websocket";

// WebSocket message types
export enum MessageType {
  PING = "ping",
  PONG = "pong",
  AUTH = "auth",
  AUTH_RESPONSE = "auth_response",
  CHAT = "chat",
  SYSTEM = "system",
  ERROR = "error",
  ECHO = "echo",
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
  DATABASE_CHANGE = "database_change",
}

// WebSocket message interface
export interface WebSocketMessage {
  type: MessageType | string;
  payload?: any;
  timestamp?: string;
  clientId?: string;
  sentAt?: string;
}

// Re-export the main WebSocket service
export { websocketService };
export default websocketService;
