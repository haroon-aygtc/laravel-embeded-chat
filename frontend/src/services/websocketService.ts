/**
 * Production-ready WebSocket service for Laravel Reverb
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing for offline/disconnected periods
 * - Heartbeat mechanism to detect dead connections
 * - Connection state management
 * - Comprehensive error handling and logging
 * - Support for Laravel Sanctum authentication
 * - Rate limiting for message sending
 * - Message validation
 * - Secure connection handling
 */

import logger from "@/utils/logger";

// WebSocket connection states
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

// WebSocket configuration interface
export interface WebSocketConfig {
  url?: string;
  appKey?: string;
  host?: string;
  port?: number | string;
  path?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  maxQueueSize?: number;
  debug?: boolean;
  connectionTimeout?: number;
  rateLimitPerSecond?: number;
  useTLS?: boolean;
}

// Callback types
export type MessageCallback = (message: any) => void;
export type ConnectionCallback = () => void;
export type DisconnectCallback = (event: CloseEvent) => void;
export type ErrorCallback = (error: Event) => void;

/**
 * WebSocket service for Laravel Reverb
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private disconnectCallbacks: DisconnectCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastPingTime = 0;
  private reconnectAttempts = 0;
  private messageQueue: any[] = [];
  private messagesSentTimestamps: number[] = [];
  private connectionAttemptTimestamp = 0;
  private clientId: string;
  private isReconnecting = false;
  private pendingReconnect = false;

  // Laravel Reverb Configuration
  private appKey: string;
  private host: string;
  private port: number | string;
  private path: string;
  private useTLS: boolean;

  // General Configuration
  private autoReconnect: boolean;
  private maxReconnectAttempts: number;
  private heartbeatIntervalMs: number;
  private heartbeatTimeoutMs: number;
  private maxQueueSize: number;
  private debug: boolean;
  private connectionTimeoutMs: number;
  private rateLimitPerSecond: number;

  /**
   * Create a new WebSocket service for Laravel Reverb
   * @param config WebSocket configuration
   */
  constructor(config: Partial<WebSocketConfig> = {}) {
    // Set Laravel Reverb configuration
    this.appKey = config.appKey || import.meta.env.VITE_REVERB_APP_KEY || 'app-key';
    this.host = config.host || import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    this.port = config.port || import.meta.env.VITE_REVERB_PORT || '';
    this.path = config.path || import.meta.env.VITE_REVERB_PATH || '/reverb';
    this.useTLS = config.useTLS ?? (window.location.protocol === 'https:');

    // Build the WebSocket URL for Laravel Reverb
    this.url = config.url || this.buildReverbUrl();

    // Set general configuration with fallbacks
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30000; // 30 seconds
    this.heartbeatTimeoutMs = config.heartbeatTimeoutMs ?? 10000; // 10 seconds
    this.maxQueueSize = config.maxQueueSize ?? 100;
    this.debug = config.debug ?? false;
    this.connectionTimeoutMs = config.connectionTimeout ?? 15000; // 15 seconds
    this.rateLimitPerSecond = config.rateLimitPerSecond ?? 10;

    // Generate or retrieve client ID
    try {
      this.clientId =
        localStorage.getItem("ws_client_id") || this.generateClientId();
    } catch (e) {
      // Handle cases where localStorage is not available (e.g., private browsing)
      this.clientId = this.generateClientId();
    }

    // Initialize performance monitoring
    this.initPerformanceMonitoring();
  }

  /**
   * Build the WebSocket URL for Laravel Reverb
   * @returns The complete WebSocket URL for Laravel Reverb
   */
  private buildReverbUrl(): string {
    // Determine protocol (wss:// for TLS, ws:// otherwise)
    const protocol = this.useTLS ? 'wss://' : 'ws://';

    // Build the host part (with optional port)
    let hostPart = this.host;
    if (this.port) {
      hostPart += `:${this.port}`;
    }

    // Ensure path starts with a slash
    const path = this.path.startsWith('/') ? this.path : `/${this.path}`;

    // Add app key as query parameter if provided
    const appKeyParam = this.appKey ? `?app_key=${this.appKey}` : '';

    // Construct the full URL
    return `${protocol}${hostPart}${path}${appKeyParam}`;
  }

  /**
   * Initialize performance monitoring for the WebSocket connection
   */
  private initPerformanceMonitoring() {
    // Set up periodic performance logging
    if (this.debug) {
      setInterval(() => {
        if (this.isConnected()) {
          const queueSize = this.messageQueue.length;
          const messageRate = this.messagesSentTimestamps.filter(
            (t) => Date.now() - t < 60000, // Messages in the last minute
          ).length;

          logger.debug("WebSocket performance metrics", {
            tags: {
              queueSize: String(queueSize),
              messageRate: String(messageRate) + "/min",
              connectionState: this.connectionState,
              reconnectAttempts: String(this.reconnectAttempts),
            },
          });
        }
      }, 60000); // Log every minute
    }
  }

  /**
   * Set the WebSocket URL
   * @param url New WebSocket URL
   * @returns this for chaining
   */
  setUrl(url: string) {
    if (this.url !== url) {
      // Only log if URL is actually changing
      logger.info(`Changing WebSocket URL from ${this.url} to ${url}`);
      this.url = url;

      // If already connected, disconnect and reconnect with new URL
      if (this.socket?.readyState === WebSocket.OPEN) {
        logger.info("Reconnecting to apply new WebSocket URL");
        this.disconnect();
        this.connect();
      }
    }
    return this;
  }

  /**
   * Get the current WebSocket URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Connect to the WebSocket server with connection timeout
   * @returns Promise that resolves when connected or rejects on failure
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected, just resolve
      if (this.socket?.readyState === WebSocket.OPEN) {
        logger.debug("WebSocket already connected, skipping connection attempt");
        resolve();
        return;
      }

      // If reconnection is in progress, queue this connection attempt
      if (this.isReconnecting) {
        logger.debug("WebSocket reconnection in progress, queueing connection attempt");
        this.pendingReconnect = true;
        resolve(); // Resolve anyway since we'll reconnect
        return;
      }

      // Clear any existing timeouts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.setConnectionState(ConnectionState.CONNECTING);
      this.connectionAttemptTimestamp = Date.now();

      // Check if the URL is valid
      let url = this.url;

      // If URL doesn't start with ws:// or wss://, add the protocol
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        url = protocol + url;
      }

      // If URL doesn't include a port, add the default port
      if (!url.match(/:\d+/)) {
        url = url.replace(/^(ws:\/\/[^\/]+)/, '$1:9001');
        url = url.replace(/^(wss:\/\/[^\/]+)/, '$1:9001');
      }

      // If URL doesn't include a path, add the default path
      if (url.match(/^(ws|wss):\/\/[^\/]+$/)) {
        url = url + '/websocket';
      }

      // Log connection attempt with detailed information
      logger.info("Attempting WebSocket connection", {
        tags: {
          url: url,
          originalUrl: this.url,
          clientId: this.clientId,
          timestamp: new Date().toISOString(),
          previousState: this.connectionState,
          reconnectAttempts: String(this.reconnectAttempts),
        },
      });

      try {
        // Try to connect with the normalized URL
        this.socket = new WebSocket(url);

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.connectionState === ConnectionState.CONNECTING) {
            const connectionTime = Date.now() - this.connectionAttemptTimestamp;

            logger.warn("WebSocket connection timeout", {
              tags: {
                connectionTime: String(connectionTime) + "ms",
                url: url,
                clientId: this.clientId,
                maxTimeout: String(this.connectionTimeoutMs) + "ms",
              },
            });

            // Force close and reconnect
            if (this.socket) {
              this.socket.close();
              this.socket = null;
            }

            // Try fallback URL if this is the first attempt
            if (this.reconnectAttempts === 0) {
              logger.info("Trying fallback WebSocket URL");

              // Try a simpler URL as fallback
              const fallbackUrl = window.location.protocol === 'https:'
                ? `wss://${window.location.host}/websocket`
                : `ws://${window.location.host}/websocket`;

              this.url = fallbackUrl;
              this.connect()
                .then(resolve)
                .catch(reject);
              return;
            }

            if (this.autoReconnect) {
              this.attemptReconnect();
              reject(new Error(`WebSocket connection timeout after ${connectionTime}ms`));
            } else {
              this.setConnectionState(ConnectionState.FAILED);
              reject(new Error(`WebSocket connection timeout after ${connectionTime}ms and auto-reconnect disabled`));
            }
          }
        }, this.connectionTimeoutMs);
      } catch (error) {
        logger.error(
          "Failed to establish WebSocket connection",
          error instanceof Error ? error : new Error(String(error)),
        );
        this.setConnectionState(ConnectionState.FAILED);
        reject(error);
      }

      // Set up event handlers
      if (this.socket) {
        this.socket.onopen = () => {
          // Clear connection timeout
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          const connectionTime = Date.now() - this.connectionAttemptTimestamp;
          logger.info(`WebSocket connection established in ${connectionTime}ms`, {
            tags: { connectionTime: String(connectionTime) + "ms" },
          });

          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.setConnectionState(ConnectionState.CONNECTED);
          this.connectionCallbacks.forEach((callback) => callback());

          // Process any queued messages
          this.processMessageQueue();

          // Start heartbeat
          this.startHeartbeat();

          // Send authentication if needed
          this.sendAuthenticationIfNeeded();

          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            // Validate that the message is valid JSON
            if (typeof event.data !== "string") {
              logger.warn("Received non-string WebSocket message", {
                extra: { type: typeof event.data }
              });
              return;
            }

            // Parse the message
            const data = JSON.parse(event.data);

            // Validate message structure
            if (!this.validateMessage(data)) {
              logger.warn("Received invalid WebSocket message structure", {
                extra: {
                  data: typeof event.data === "string"
                    ? event.data.substring(0, 100)
                    : "non-string data"
                }
              });
              return;
            }

            // Handle pong response
            if (data.type === "pong") {
              this.handlePong();
              return;
            }

            // Handle auth response
            if (data.type === "auth_response") {
              this.handleAuthResponse(data);
              return;
            }

            // Log message receipt in debug mode
            if (this.debug) {
              logger.debug(`WebSocket message received: ${data.type}`, {
                tags: {
                  messageType: data.type,
                  timestamp: data.timestamp || new Date().toISOString()
                }
              });
            }

            // Notify all message callbacks
            this.messageCallbacks.forEach((callback) => callback(data));
          } catch (error) {
            logger.error(
              "Error parsing WebSocket message",
              error instanceof Error ? error : new Error(String(error)),
              {
                extra: {
                  rawData:
                    typeof event.data === "string"
                      ? event.data.substring(0, 100)
                      : "non-string data",
                },
              },
            );
          }
        };

        this.socket.onclose = (event) => {
          // Clear connection timeout if it exists
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          const wasClean = event.wasClean;
          const code = event.code;
          const reason = event.reason || 'No reason provided';
          const connectionDuration = this.connectionAttemptTimestamp
            ? Date.now() - this.connectionAttemptTimestamp
            : 0;

          // Log with appropriate level based on closure type
          if (wasClean && (code === 1000 || code === 1001)) {
            // Normal closure
            logger.info(`WebSocket connection closed normally: ${code} ${reason}`, {
              tags: {
                code: String(code),
                wasClean: String(wasClean),
                connectionDuration: String(connectionDuration) + "ms",
              },
            });
          } else {
            // Abnormal closure
            logger.warn(`WebSocket connection closed abnormally: ${code} ${reason}`, {
              tags: {
                code: String(code),
                wasClean: String(wasClean),
                connectionDuration: String(connectionDuration) + "ms",
              },
            });
          }

          this.socket = null;
          this.setConnectionState(ConnectionState.DISCONNECTED);
          this.stopHeartbeat();

          // Notify disconnect callbacks
          this.disconnectCallbacks.forEach((callback) => callback(event));

          // Attempt to reconnect if not a normal closure and auto-reconnect is enabled
          if (
            this.autoReconnect &&
            code !== 1000 && // Normal closure
            code !== 1001 && // Going away (page close/refresh)
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            // Add a small delay before reconnecting to avoid rapid reconnection attempts
            setTimeout(() => {
              this.attemptReconnect();
            }, 1000);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.setConnectionState(ConnectionState.FAILED);
            logger.error("WebSocket reconnection failed after maximum attempts", {
              tags: { maxAttempts: String(this.maxReconnectAttempts) },
            });
          }
        };

        this.socket.onerror = (error) => {
          // Get more detailed error information if possible
          let errorMessage = "WebSocket connection error";
          let errorDetails = {};

          try {
            // Try to extract more information from the error event
            if (error instanceof Event) {
              const target = error.target as WebSocket;
              if (target) {
                errorDetails = {
                  readyState: target.readyState,
                  url: target.url || this.url,
                };

                // Check if the error is related to security or CORS
                if (target.url && (target.url.startsWith('wss:') || window.location.protocol === 'https:')) {
                  errorMessage = "WebSocket security error - check SSL certificates and CORS settings";
                }
              }
            }
          } catch (e) {
            // Ignore errors in error handling
          }

          logger.error(
            "WebSocket error",
            new Error(errorMessage),
            {
              extra: {
                ...errorDetails,
                originalError: error
              }
            },
          );

          // Notify error callbacks
          this.errorCallbacks.forEach((callback) => callback(error));

          // If we're still in connecting state, this is a connection error
          if (this.connectionState === ConnectionState.CONNECTING) {
            // Force state to failed so we can try reconnecting
            this.setConnectionState(ConnectionState.FAILED);

            // Try fallback URL if this is the first attempt
            if (this.reconnectAttempts === 0) {
              logger.info("Connection error, trying fallback WebSocket URL");

              // Try a simpler URL as fallback
              const fallbackUrl = window.location.protocol === 'https:'
                ? `wss://${window.location.host}/ws`
                : `ws://${window.location.host}/ws`;

              this.url = fallbackUrl;
              setTimeout(() => {
                this.connect().catch(() => {
                  logger.error("All connection attempts failed");
                });
              }, 1000);
            } else if (this.autoReconnect) {
              // Try to reconnect with exponential backoff
              this.attemptReconnect();
            }
          }
        };
      }
    });
  }

  /**
   * Send authentication data if needed
   */
  private sendAuthenticationIfNeeded() {
    // Get auth token from localStorage or other secure storage
    try {
      // For Laravel Sanctum, we use the XSRF token
      const xsrfToken = this.getXsrfToken();
      const authToken = localStorage.getItem("auth_token");

      if (xsrfToken || authToken) {
        this.authenticate({
          token: authToken || '',
          xsrfToken: xsrfToken || ''
        });
      }
    } catch (error) {
      // Handle localStorage not available
      logger.warn("Failed to access authentication data for WebSocket", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get XSRF token from cookie for Laravel Sanctum
   */
  private getXsrfToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Authenticate the WebSocket connection with Laravel Sanctum
   * @param authData Authentication data to send
   */
  authenticate(authData: { token?: string, xsrfToken?: string }) {
    if (!this.isConnected()) {
      logger.warn("Cannot authenticate: WebSocket is not connected");
      return;
    }

    logger.info("Sending WebSocket authentication request to Laravel Reverb");

    // For Laravel Reverb, we send the authentication message
    this.sendMessage({
      event: "pusher:subscribe",
      data: {
        auth: authData.token || '',
        channel: "private-user." + this.getUserId(),
        socket_id: this.clientId,
        csrf_token: authData.xsrfToken || ''
      }
    });
  }

  /**
   * Get the current user ID from localStorage or other source
   */
  private getUserId(): string {
    try {
      // Try to get user ID from localStorage
      const userId = localStorage.getItem("user_id");
      if (userId) {
        return userId;
      }

      // If no user ID found, return a default value
      return "guest";
    } catch (error) {
      // Handle localStorage not available
      return "guest";
    }
  }

  /**
   * Handle authentication response
   * @param data Authentication response data
   */
  private handleAuthResponse(data: any) {
    if (data.success) {
      logger.info("WebSocket authentication successful");
    } else {
      logger.warn("WebSocket authentication failed", {
        extra: { reason: data.reason || "Unknown reason" },
      });
    }
  }

  /**
   * Update and log connection state changes
   */
  private setConnectionState(state: ConnectionState) {
    const previousState = this.connectionState;
    this.connectionState = state;

    logger.info(
      `WebSocket connection state changed: ${previousState} -> ${state}`,
      {
        tags: { previousState, currentState: state },
      },
    );
  }

  /**
   * Start heartbeat mechanism to detect dead connections
   */
  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing intervals

    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.sendPing();

        // Set timeout for pong response
        this.pongTimeout = setTimeout(() => {
          logger.warn("Pong response not received, connection may be dead", {
            tags: { lastPingTime: new Date(this.lastPingTime).toISOString() },
          });

          // Force reconnection
          this.disconnect();
          if (this.autoReconnect) {
            this.connect();
          }
        }, this.heartbeatTimeoutMs);
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Send ping message to server
   */
  private sendPing() {
    this.sendMessage({ type: "ping", timestamp: Date.now() });
  }

  /**
   * Handle pong response from server
   */
  private handlePong() {
    const latency = Date.now() - this.lastPingTime;

    if (this.debug) {
      logger.debug(`WebSocket heartbeat received, latency: ${latency}ms`, {
        tags: { latency: String(latency) + "ms" },
      });
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.isReconnecting) {
      this.pendingReconnect = true;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff with jitter and max delay
    const baseDelay = Math.min(
      30000,
      Math.pow(2, this.reconnectAttempts) * 1000,
    );
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;

    this.setConnectionState(ConnectionState.RECONNECTING);
    logger.info(
      `Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      {
        tags: {
          attempt: String(this.reconnectAttempts),
          maxAttempts: String(this.maxReconnectAttempts),
          delay: String(Math.round(delay)) + "ms",
        },
      },
    );

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error("Error during reconnection attempt", error);
      });

      // Handle any pending reconnect requests
      if (this.pendingReconnect) {
        this.pendingReconnect = false;
        this.isReconnecting = false;
        this.attemptReconnect();
      } else {
        this.isReconnecting = false;
      }
    }, delay);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.setConnectionState(ConnectionState.DISCONNECTED);

    if (this.socket) {
      try {
        this.socket.close(1000, "Normal closure");
      } catch (e) {
        // Ignore errors during close
      }
      this.socket = null;
    }

    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Check if message sending is rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 second
    this.messagesSentTimestamps = this.messagesSentTimestamps.filter(
      (timestamp) => now - timestamp < 1000,
    );

    // Check if we've sent too many messages in the last second
    return this.messagesSentTimestamps.length >= this.rateLimitPerSecond;
  }

  /**
   * Send a message to the WebSocket server
   */
  sendMessage(message: any): boolean {
    // Add timestamp and client ID to outgoing messages
    const enhancedMessage = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      clientId: this.getClientId(),
    };

    // Check rate limiting
    if (this.isRateLimited()) {
      logger.warn("Rate limit exceeded, queueing message", {
        tags: {
          messageType: message.type,
          rateLimit: String(this.rateLimitPerSecond) + "/sec",
        },
      });
      this.queueMessage(enhancedMessage);
      return false;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(enhancedMessage));
        // Track message for rate limiting
        this.messagesSentTimestamps.push(Date.now());
        return true;
      } catch (error) {
        logger.error(
          "Error sending WebSocket message",
          error instanceof Error ? error : new Error(String(error)),
          { tags: { messageType: enhancedMessage.type } },
        );
        this.queueMessage(enhancedMessage);
        return false;
      }
    } else {
      logger.warn(
        "Cannot send message: WebSocket is not connected, queueing message",
        {
          tags: {
            messageType: enhancedMessage.type,
            connectionState: this.connectionState,
          },
        },
      );
      this.queueMessage(enhancedMessage);
      return false;
    }
  }

  /**
   * Queue a message for later sending
   */
  private queueMessage(message: any): void {
    // Don't queue ping messages
    if (message.type === "ping") return;

    // Add to queue with a maximum size limit
    if (this.messageQueue.length < this.maxQueueSize) {
      this.messageQueue.push(message);
    } else {
      logger.warn("Message queue full, dropping oldest message", {
        tags: {
          queueSize: String(this.messageQueue.length),
          maxSize: String(this.maxQueueSize),
        },
      });
      this.messageQueue.shift(); // Remove oldest message
      this.messageQueue.push(message); // Add new message
    }

    // If we're disconnected, try to reconnect
    if (
      this.connectionState === ConnectionState.DISCONNECTED &&
      this.autoReconnect
    ) {
      this.connect().catch((error) => {
        logger.error("Error reconnecting after queueing message", error);
      });
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    logger.info(`Processing ${this.messageQueue.length} queued messages`, {
      tags: { queueSize: String(this.messageQueue.length) },
    });

    // Process queued messages with rate limiting
    const processNextBatch = () => {
      const batchSize = Math.min(
        this.rateLimitPerSecond,
        this.messageQueue.length,
      );
      let successCount = 0;

      for (let i = 0; i < batchSize; i++) {
        if (this.messageQueue.length === 0) break;

        const message = this.messageQueue.shift();
        if (this.socket?.readyState === WebSocket.OPEN) {
          try {
            this.socket.send(JSON.stringify(message));
            this.messagesSentTimestamps.push(Date.now());
            successCount++;
          } catch (error) {
            // Put message back and stop processing
            this.messageQueue.unshift(message);
            break;
          }
        } else {
          // Connection lost during processing, put message back and stop
          this.messageQueue.unshift(message);
          break;
        }
      }

      // If we still have messages and connection is open, schedule next batch
      if (this.messageQueue.length > 0 && this.isConnected()) {
        setTimeout(processNextBatch, 1000); // Process next batch after 1 second
      }

      return successCount;
    };

    const processedCount = processNextBatch();

    if (processedCount > 0) {
      logger.debug(
        `Processed ${processedCount} queued messages, ${this.messageQueue.length} remaining`,
        {
          tags: {
            processed: String(processedCount),
            remaining: String(this.messageQueue.length),
          },
        },
      );
    }
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Register a callback for connection events
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Register a callback for error events
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Register a callback for disconnect events
   */
  onDisconnect(callback: DisconnectCallback): () => void {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get WebSocket statistics
   */
  getStats(): any {
    return {
      connectionState: this.connectionState,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnected: this.isConnected(),
      messageRatePerMinute: this.messagesSentTimestamps.filter(
        (t) => Date.now() - t < 60000, // Messages in the last minute
      ).length,
      latency: this.lastPingTime > 0 ? Date.now() - this.lastPingTime : undefined,
      url: this.url,
      clientId: this.clientId,
    };
  }

  /**
   * Get the client ID for this session
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Validate incoming WebSocket message structure
   * @param message The message to validate
   * @returns Boolean indicating if the message is valid
   */
  private validateMessage(message: any): boolean {
    // Check if message is an object
    if (!message || typeof message !== "object") {
      logger.warn("Invalid WebSocket message: not an object", {
        extra: { receivedType: typeof message }
      });
      return false;
    }

    // Check for required fields
    if (typeof message.type !== "string") {
      logger.warn("Invalid WebSocket message: missing or invalid 'type' field", {
        extra: {
          hasType: 'type' in message,
          typeValue: message.type,
          typeType: typeof message.type
        }
      });
      return false;
    }

    // Validate specific message types
    switch (message.type) {
      case "ping":
      case "pong":
        // Ping/pong messages should have a timestamp or sentAt
        const hasPingTimestamp = typeof message.timestamp === "string" ||
          typeof message.timestamp === "number" ||
          typeof message.sentAt !== "undefined";

        if (!hasPingTimestamp) {
          logger.warn(`Invalid ${message.type} message: missing timestamp or sentAt`, {
            extra: { message }
          });
        }
        return hasPingTimestamp;

      case "auth_response":
        // Auth response should have success field
        const hasAuthSuccess = typeof message.success === "boolean";

        if (!hasAuthSuccess) {
          logger.warn("Invalid auth_response message: missing or invalid 'success' field", {
            extra: {
              hasSuccess: 'success' in message,
              successValue: message.success,
              successType: typeof message.success
            }
          });
        }
        return hasAuthSuccess;

      case "message":
      case "chat":
        // Chat messages should have content or payload
        const hasContent = typeof message.content === "string";
        const hasPayload = typeof message.payload === "object" && message.payload !== null;

        if (!hasContent && !hasPayload) {
          logger.warn(`Invalid ${message.type} message: missing content or payload`, {
            extra: {
              hasContent: 'content' in message,
              contentType: typeof message.content,
              hasPayload: 'payload' in message,
              payloadType: typeof message.payload
            }
          });
        }
        return hasContent || hasPayload;

      case "notification":
        // Notification messages should have a notification object
        const hasNotification = typeof message.notification === "object" && message.notification !== null;

        if (!hasNotification) {
          logger.warn("Invalid notification message: missing or invalid 'notification' field", {
            extra: {
              hasNotification: 'notification' in message,
              notificationType: typeof message.notification
            }
          });
        }
        return hasNotification;

      case "error":
        // Error messages should have an error message
        const hasErrorMessage = typeof message.message === "string";

        if (!hasErrorMessage) {
          logger.warn("Invalid error message: missing or invalid 'message' field", {
            extra: {
              hasMessage: 'message' in message,
              messageType: typeof message.message
            }
          });
        }
        return hasErrorMessage;

      // For other message types, be more lenient but log for debugging
      default:
        if (this.debug) {
          logger.debug(`Received message with non-standard type: ${message.type}`, {
            extra: { messageKeys: Object.keys(message) }
          });
        }
        return true;
    }
  }

  /**
   * Generate a unique client ID for this browser session
   */
  private generateClientId(): string {
    const id =
      "client_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    try {
      localStorage.setItem("ws_client_id", id);
    } catch (e) {
      // Ignore localStorage errors
    }

    return id;
  }
}

// Determine if we're in a production environment
const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Determine the WebSocket protocol based on the current page protocol
 * @returns The appropriate WebSocket protocol (ws:// or wss://)
 */
const getWebSocketProtocol = (): string => {
  try {
    if (typeof window !== 'undefined') {
      return window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    }
  } catch (e) {
    // Ignore errors when window is not available
  }

  // Default to secure in production, insecure in development
  return isProd ? 'wss://' : 'ws://';
};

/**
 * Get the WebSocket host from environment variables or current location
 * @returns The host for WebSocket connections
 */
const getWebSocketHost = (): string => {
  try {
    // Check for explicitly configured host
    const configuredHost = import.meta.env.VITE_API_WS_HOST;
    if (configuredHost && configuredHost.trim() !== '') {
      return configuredHost;
    }

    // Check for API URL that we can parse
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.trim() !== '') {
      try {
        const url = new URL(apiUrl);
        return url.hostname;
      } catch (e) {
        // Invalid URL, continue to next option
      }
    }

    // Use current window location as fallback
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
  } catch (e) {
    // Log error but continue with default
    console.error("Error determining WebSocket host:", e);
  }

  // Default fallback
  return 'localhost';
};

/**
 * Get the WebSocket port from environment variables or defaults
 * @returns The port for WebSocket connections (or empty string if default port)
 */
const getWebSocketPort = (): string => {
  try {
    // Check for explicitly configured port
    const configuredPort = import.meta.env.VITE_API_WS_PORT;
    if (configuredPort && configuredPort.trim() !== '') {
      return configuredPort;
    }

    // Check for API URL that we can parse
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.trim() !== '') {
      try {
        const url = new URL(apiUrl);
        if (url.port) {
          return url.port;
        }
      } catch (e) {
        // Invalid URL, continue to next option
      }
    }

    // In production with secure WebSockets, we typically don't specify a port
    if (isProd && getWebSocketProtocol() === 'wss://') {
      return '';
    }

    // Use current window location port as fallback
    if (typeof window !== 'undefined' && window.location.port) {
      return window.location.port;
    }
  } catch (e) {
    // Log error but continue with default
    console.error("Error determining WebSocket port:", e);
  }

  // Default fallback - 9001 for development, empty for production
  return isProd ? '' : '9001';
};

/**
 * Get the WebSocket path from environment variables or defaults
 * @returns The path for WebSocket connections
 */
const getWebSocketPath = (): string => {
  try {
    // Check for explicitly configured path
    const configuredPath = import.meta.env.VITE_API_WS_PATH;
    if (configuredPath) {
      // Ensure path starts with a slash
      return configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`;
    }
  } catch (e) {
    // Log error but continue with default
    console.error("Error determining WebSocket path:", e);
  }

  // Default fallback
  return '/websocket';
};

/**
 * Construct the WebSocket URL from components or environment variables
 * @returns The complete WebSocket URL
 */
const constructWebSocketUrl = (): string => {
  // First check if there's a complete URL configured
  try {
    const configuredUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (configuredUrl && configuredUrl.trim() !== '') {
      // Validate the URL format
      if (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://')) {
        return configuredUrl;
      } else {
        // Add protocol if missing
        const protocol = getWebSocketProtocol();
        return `${protocol}${configuredUrl}`;
      }
    }
  } catch (e) {
    // Ignore errors and continue with component-based construction
  }

  // Construct URL from components
  try {
    const protocol = getWebSocketProtocol();
    const host = getWebSocketHost();
    const port = getWebSocketPort();
    const path = getWebSocketPath();

    // Only add port if it's specified
    const portSuffix = port ? `:${port}` : '';

    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${protocol}${host}${portSuffix}${normalizedPath}`;
  } catch (e) {
    // Log error and return a fallback URL
    console.error("Error constructing WebSocket URL:", e);
    return isProd
      ? 'wss://localhost/websocket'  // Secure fallback
      : 'ws://localhost:9001/websocket';  // Development fallback
  }
};

// Create a singleton instance with a configurable URL
const WS_URL = constructWebSocketUrl();

// Log the WebSocket configuration
if (import.meta.env.DEV) {
  console.log('WebSocket Configuration:', {
    url: WS_URL,
    protocol: getWebSocketProtocol(),
    host: getWebSocketHost(),
    port: getWebSocketPort(),
    path: getWebSocketPath(),
    environment: import.meta.env.MODE
  });
}

// Initialize the WebSocket service with production-ready configuration
const websocketService = new WebSocketService({
  url: WS_URL,
  autoReconnect: true,
  maxReconnectAttempts: isProd ? 20 : 10, // More retries in production
  heartbeatIntervalMs: 30000, // 30 seconds
  heartbeatTimeoutMs: 10000, // 10 seconds
  maxQueueSize: isProd ? 200 : 100, // Larger queue in production
  debug: import.meta.env.DEV, // Enable debug in development only
  connectionTimeout: isProd ? 20000 : 15000, // Longer timeout in production
  rateLimitPerSecond: isProd ? 20 : 10, // Higher rate limit in production
});

// Auto-connect when the service is imported (can be disabled by setting VITE_WS_AUTO_CONNECT=false)
if (import.meta.env.VITE_WS_AUTO_CONNECT !== "false") {
  // Small delay to ensure app is fully loaded before connecting
  setTimeout(() => {
    logger.info("Auto-connecting to WebSocket server", {
      tags: { url: WS_URL, environment: import.meta.env.MODE },
    });

    try {
      // Check if the browser supports WebSockets
      if (typeof WebSocket === 'undefined') {
        logger.warn("WebSocket not supported in this browser");
        return;
      }

      // Attempt to connect
      websocketService.connect().catch((error) => {
        logger.error("Failed to auto-connect to WebSocket server", error);

        // Try a simpler fallback URL
        const fallbackUrl = window.location.protocol === 'https:'
          ? `wss://${window.location.host}/ws`
          : `ws://${window.location.host}/ws`;

        logger.info("Trying fallback WebSocket URL", {
          tags: { fallbackUrl }
        });

        websocketService.setUrl(fallbackUrl);
        websocketService.connect().catch((error) => {
          logger.error("All connection attempts failed", error);
        });
      });
    } catch (error) {
      logger.error("Error during WebSocket initialization", error);
    }
  }, 1000);
}

export default websocketService;
