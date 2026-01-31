'use client';

import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import WebSocketManager, { WebSocketState } from '@/managers/websocketManager';

export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
}

interface WebSocketContextType {
  socket: WebSocket | null;
  connectionState: WebSocketConnectionState;
  lastMessage: unknown;
  sendMessage: (message: unknown) => void;
  reconnect: () => void;
  isReconnected: boolean;
  resetReconnectedFlag: () => void;
  lastError: string | null;
  clearError: () => void;
}

const defaultContextValue: WebSocketContextType = {
  socket: null,
  connectionState: WebSocketConnectionState.CLOSED,
  lastMessage: null,
  sendMessage: () => {},
  reconnect: () => {},
  isReconnected: false,
  resetReconnectedFlag: () => {},
  lastError: null,
  clearError: () => {},
};

const WebSocketContext = createContext<WebSocketContextType>(defaultContextValue);

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  children,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(WebSocketConnectionState.CLOSED);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [isReconnected, setIsReconnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const managerRef = useRef<WebSocketManager | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    managerRef.current = WebSocketManager.getInstance({ url, reconnectInterval, maxReconnectAttempts });
    const manager = managerRef.current;

    const removeCallback = manager.addCallback({
      onOpen: () => {
        const socket = manager.getSocket();
        setTimeout(() => {
          setSocket(socket);
          setConnectionState(WebSocketConnectionState.OPEN);
        }, 0);
        reconnectAttemptsRef.current = 0;
        if (reconnectAttemptsRef.current > 0) setIsReconnected(true);
      },
      onMessage: (event) => {
        try {
          setLastMessage(JSON.parse(event.data));
        } catch {
          setLastMessage(event.data);
        }
      },
      onClose: () => {
        setSocket(null);
        setConnectionState(WebSocketConnectionState.CLOSED);
      },
      onError: (event) => {
        const errorTime = new Date().toISOString();
        const errorMsg = `[${errorTime}] WebSocket Error: Connection failed or interrupted. State: ${connectionState}`;
        setLastError(errorMsg);
        setConnectionState(WebSocketConnectionState.CLOSED);
        logger.log(LogLevel.ERROR, errorMsg, LogLabel.WEBSOCKET, ServiceName.WEBSOCKET, { event });
      },
    });

    manager.connect().catch(() => setConnectionState(WebSocketConnectionState.CLOSED));

    const state = manager.getReadyState();
    if (state === WebSocketState.OPEN) {
      setSocket(manager.getSocket());
      setConnectionState(WebSocketConnectionState.OPEN);
    } else if (state === WebSocketState.CONNECTING) {
      setConnectionState(WebSocketConnectionState.CONNECTING);
    }

    return () => removeCallback();
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const sendMessage = useCallback((message: unknown) => {
    managerRef.current?.sendMessage(message);
  }, []);

  const reconnect = useCallback(() => {
    if (managerRef.current) {
      reconnectAttemptsRef.current = 0;
      setIsReconnected(false);
      managerRef.current.reconnect();
    }
  }, []);

  const resetReconnectedFlag = useCallback(() => setIsReconnected(false), []);
  const clearError = useCallback(() => setLastError(null), []);

  const value: WebSocketContextType = {
    socket,
    connectionState,
    lastMessage,
    sendMessage,
    reconnect,
    isReconnected,
    resetReconnectedFlag,
    lastError,
    clearError,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
};
