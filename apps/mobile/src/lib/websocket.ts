/**
 * WebSocket Client for Real-time Updates
 * Implements auto-reconnect, heartbeat, and connection state management
 */

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketConfig {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
  heartbeatInterval?: number;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (state: ConnectionState) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private retryCount = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private connectionState: ConnectionState = 'disconnected';
  private subscriptions: Set<string> = new Set();
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    this.updateConnectionState('connecting');

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateConnectionState('disconnected');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.add(channel);
      this.sendSubscriptionMessage(channel, 'subscribe');
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      this.sendSubscriptionMessage(channel, 'unsubscribe');
    }
  }

  /**
   * Register a message handler for a specific channel
   */
  on(channel: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }
    this.messageHandlers.get(channel)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(channel);
        }
      }
    };
  }

  /**
   * Register a connection state handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  // Private methods

  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.retryCount = 0;
    this.updateConnectionState('connected');
    this.startHeartbeat();

    // Resubscribe to all channels after reconnect
    this.subscriptions.forEach(channel => {
      this.sendSubscriptionMessage(channel, 'subscribe');
    });
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Closed:', event.code, event.reason);
    this.stopHeartbeat();

    if (!this.isManualClose) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event | Error | unknown): void {
    console.error('[WebSocket] Error:', error);
    this.updateConnectionState('error');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Handle heartbeat response
      if (data.type === 'pong') {
        return;
      }

      // Determine channel from message
      const channel = data.channel || data.stream || 'default';

      const message: WebSocketMessage = {
        type: data.type || data.e || 'message',
        data: data,
        timestamp: data.timestamp || data.E || Date.now(),
      };

      // Notify handlers for this channel
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('[WebSocket] Handler error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Message parse error:', error);
    }
  }

  private sendSubscriptionMessage(channel: string, action: 'subscribe' | 'unsubscribe'): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        method: action,
        params: [channel],
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
      console.log(`[WebSocket] ${action} to ${channel}`);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('[WebSocket] Heartbeat error:', error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.log('[WebSocket] Max retries reached');
      this.updateConnectionState('error');
      return;
    }

    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.retryCount + 1}/${this.config.maxRetries})`);

    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.retryCount++;
      this.updateConnectionState('connecting');
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('[WebSocket] Connection handler error:', error);
      }
    });
  }
}

/**
 * Singleton WebSocket client instance
 */
let wsClient: WebSocketClient | null = null;

/**
 * Get or create the singleton WebSocket client
 */
export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient {
  if (!wsClient && config) {
    wsClient = new WebSocketClient(config);
  }
  return wsClient!;
}

/**
 * Reset the singleton WebSocket client (useful for testing)
 */
export function resetWebSocketClient(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

export { WebSocketClient };
