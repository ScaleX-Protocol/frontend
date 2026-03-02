/**
 * WebSocket Singleton Manager
 * Platform-agnostic WebSocket manager
 *
 * Ensures only one WebSocket connection exists per URL across the entire application.
 * Note: Logger is optional and passed via callbacks to avoid dependencies
 */

// Define a compatible WebSocket interface that works across platforms
interface IWebSocket {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: any) => void) | null;
  onclose: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string): void;
  close(): void;
  ping?(): void; // Optional ping method
}

export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface WebSocketManagerConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  onLog?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;
}

export interface WebSocketManagerCallbacks {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: Event) => void;
  onError?: (event: Event) => void;
}

class WebSocketManager {
  private static instances = new Map<string, WebSocketManager>();

  private socket: IWebSocket | null = null;
  private config: WebSocketManagerConfig;
  private callbacks: Set<WebSocketManagerCallbacks> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionalClose = false;

  private constructor(config: WebSocketManagerConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config,
    };
  }

  public static getInstance(config: WebSocketManagerConfig): WebSocketManager {
    const { url } = config;

    if (!this.instances.has(url)) {
      this.instances.set(url, new WebSocketManager(config));
      config.onLog?.('info', `Creating new WebSocket manager for ${url}`);
    } else {
      config.onLog?.('debug', `Reusing existing WebSocket manager for ${url}`);
    }

    return this.instances.get(url)!;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocketState.OPEN) {
        resolve();
        return;
      }

      if (this.socket && this.socket.readyState === WebSocketState.CONNECTING) {
        // Wait for existing connection
        const onOpen = () => {
          resolve();
          this.removeCallback({ onOpen });
        };
        const onError = (event: Event) => {
          reject(new Error('Connection failed'));
          this.removeCallback({ onError });
        };
        this.addCallback({ onOpen, onError });
        return;
      }

      this.createSocket();

      const onOpen = () => {
        resolve();
        this.removeCallback({ onOpen });
      };

      const onError = (event: Event) => {
        reject(new Error('Connection failed'));
        this.removeCallback({ onError });
      };

      this.addCallback({ onOpen, onError });
    });
  }

  private createSocket(): void {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new (globalThis.WebSocket || (global as any).WebSocket)(this.config.url) as IWebSocket;
    this.isIntentionalClose = false;

    this.config.onLog?.('info', `Creating WebSocket connection to ${this.config.url}`);

    this.socket.onopen = (event: Event) => {
      this.config.onLog?.('info', `WebSocket connected to ${this.config.url}`);

      this.reconnectAttempts = 0;
      this.startPingInterval();

      this.callbacks.forEach(callback => {
        callback.onOpen?.(event);
      });
    };

    this.socket.onmessage = (event: any) => {
      // Create a simplified MessageEvent-like object
      const messageEvent = {
        data: event.data,
        origin: event.origin || '',
        lastEventId: '',
        source: null,
        ports: [],
      };

      this.callbacks.forEach(callback => {
        callback.onMessage?.(messageEvent as unknown as MessageEvent);
      });
    };

    this.socket.onclose = (event: Event) => {
      const closeCode = (event as any).code || 0;
      const closeReason = (event as any).reason || '';

      this.config.onLog?.('info', `WebSocket closed: ${closeCode} - ${closeReason}`, {
        wasIntentional: this.isIntentionalClose,
      });

      this.stopPingInterval();

      this.callbacks.forEach(callback => {
        callback.onClose?.(event);
      });

      // Attempt reconnection if not intentional
      if (!this.isIntentionalClose && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (event: Event) => {
      this.config.onLog?.('error', `WebSocket error for ${this.config.url}`, { event });

      this.callbacks.forEach(callback => {
        callback.onError?.(event);
      });
    };
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;

    this.config.onLog?.(
      'info',
      `Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.createSocket();
    }, this.config.reconnectInterval);
  }

  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocketState.OPEN) {
        this.sendMessage({ method: 'PING' });
        this.config.onLog?.('debug', 'WebSocket ping sent');

        // Optional: Use native ping if available
        if (this.socket.ping) {
          try {
            this.socket.ping();
          } catch (error) {
            this.config.onLog?.('warn', 'WebSocket ping method failed', { error });
          }
        }
      }
    }, this.config.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageString);

      this.config.onLog?.('debug', 'WebSocket message sent', {
        message: messageString.substring(0, 100),
      });
    } else {
      this.config.onLog?.('warn', 'Cannot send message - WebSocket not connected', {
        readyState: this.socket?.readyState,
      });
    }
  }

  public addCallback(callback: WebSocketManagerCallbacks): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  public removeCallback(callback: Partial<WebSocketManagerCallbacks>): void {
    this.callbacks.forEach(cb => {
      let shouldRemove = true;

      if (callback.onOpen && cb.onOpen !== callback.onOpen) shouldRemove = false;
      if (callback.onMessage && cb.onMessage !== callback.onMessage) shouldRemove = false;
      if (callback.onClose && cb.onClose !== callback.onClose) shouldRemove = false;
      if (callback.onError && cb.onError !== callback.onError) shouldRemove = false;

      if (shouldRemove) {
        this.callbacks.delete(cb);
      }
    });
  }

  public getReadyState(): WebSocketState {
    if (!this.socket) return WebSocketState.CLOSED;
    return this.socket.readyState;
  }

  public isConnected(): boolean {
    return this.getReadyState() === WebSocketState.OPEN;
  }

  public getSocket(): IWebSocket | null {
    return this.socket;
  }

  public close(): void {
    this.isIntentionalClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Remove from instances map
    WebSocketManager.instances.delete(this.config.url);

    this.config.onLog?.('info', `WebSocket manager closed for ${this.config.url}`);
  }

  public reconnect(): void {
    this.config.onLog?.('info', `Manual reconnection requested for ${this.config.url}`);

    this.reconnectAttempts = 0;
    this.isIntentionalClose = false;

    if (this.socket) {
      this.socket.close();
    }

    this.createSocket();
  }
}

export default WebSocketManager;
