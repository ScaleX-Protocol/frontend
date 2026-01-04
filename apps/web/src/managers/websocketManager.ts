import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

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
}

export interface WebSocketManagerCallbacks {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

class WebSocketManager {
  private static instances = new Map<string, WebSocketManager>();

  private socket: WebSocket | null = null;
  private config: WebSocketManagerConfig;
  private callbacks: Set<WebSocketManagerCallbacks> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
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
    }
    return this.instances.get(url)!;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
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
    if (this.socket) this.socket.close();

    this.socket = new WebSocket(this.config.url);
    this.isIntentionalClose = false;

    this.socket.onopen = (event) => {
      this.reconnectAttempts = 0;
      this.startPingInterval();
      this.callbacks.forEach(callback => callback.onOpen?.(event));
    };

    this.socket.onmessage = (event) => {
      this.callbacks.forEach(callback => callback.onMessage?.(event));
    };

    this.socket.onclose = (event) => {
      this.stopPingInterval();
      this.callbacks.forEach(callback => callback.onClose?.(event));
      if (!this.isIntentionalClose && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (event) => {
      logger.log(LogLevel.ERROR, 'WebSocket error', LogLabel.SYSTEM, ServiceName.FRONTEND, { url: this.config.url });
      this.callbacks.forEach(callback => callback.onError?.(event));
    };
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.createSocket(), this.config.reconnectInterval);
  }

  private startPingInterval(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendMessage({ method: 'PING' });
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
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
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

  public getSocket(): WebSocket | null {
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
    WebSocketManager.instances.delete(this.config.url);
  }

  public reconnect(): void {
    this.reconnectAttempts = 0;
    this.isIntentionalClose = false;
    if (this.socket) this.socket.close();
    this.createSocket();
  }
}

export default WebSocketManager;