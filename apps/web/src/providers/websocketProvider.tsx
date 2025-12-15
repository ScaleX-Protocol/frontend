'use client';

import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import WebSocketManager, { WebSocketState } from '@/managers/websocketManager';

// WebSocket connection states
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
}

// WebSocket context interface
interface WebSocketContextType {
  socket: WebSocket | null;
  connectionState: WebSocketConnectionState;
  lastMessage: unknown;
  sendMessage: (message: unknown) => void;
  reconnect: () => void;
  isReconnected: boolean;
  resetReconnectedFlag: () => void;
}

// Default context values
const defaultContextValue: WebSocketContextType = {
  socket: null,
  connectionState: WebSocketConnectionState.CLOSED,
  lastMessage: null,
  sendMessage: () => {},
  reconnect: () => {},
  isReconnected: false,
  resetReconnectedFlag: () => {},
};

// Create context
const WebSocketContext = createContext<WebSocketContextType>(defaultContextValue);

// Props for the WebSocket provider
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

  // Use refs to avoid stale closures
  const managerRef = useRef<WebSocketManager | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize or get singleton WebSocket manager
  useEffect(() => {
    managerRef.current = WebSocketManager.getInstance({
      url,
      reconnectInterval,
      maxReconnectAttempts,
    });

    const manager = managerRef.current;

    // Set up callbacks
    const removeCallback = manager.addCallback({
      onOpen: (event) => {
        logger.log(LogLevel.INFO, 'WebSocket connection established', LogLabel.SYSTEM, ServiceName.FRONTEND, { url });
        // Get the socket from the manager after connection is established
        const socket = manager.getSocket();

        // Force state updates to happen immediately
        setTimeout(() => {
          setSocket(socket);
          setConnectionState(WebSocketConnectionState.OPEN);

          logger.log(LogLevel.INFO, 'WebSocket state updated to OPEN', LogLabel.SYSTEM, ServiceName.FRONTEND, {
            socket: !!socket,
            readyState: socket?.readyState
          });
        }, 0);

        reconnectAttemptsRef.current = 0;

        // Set reconnected flag if this was a reconnection
        if (reconnectAttemptsRef.current > 0) {
          setIsReconnected(true);
        }
      },
      onMessage: (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setLastMessage(parsedData);
        } catch (error) {
          logger.log(LogLevel.ERROR, 'Error parsing WebSocket message', LogLabel.SYSTEM, ServiceName.FRONTEND, { error: error instanceof Error ? error.message : error });
          setLastMessage(event.data);
        }
      },
      onClose: (event) => {
        logger.log(LogLevel.INFO, 'WebSocket connection closed', LogLabel.SYSTEM, ServiceName.FRONTEND, { code: event.code, reason: event.reason });
        setSocket(null);
        setConnectionState(WebSocketConnectionState.CLOSED);
      },
      onError: (event) => {
        logger.log(LogLevel.ERROR, 'WebSocket error', LogLabel.SYSTEM, ServiceName.FRONTEND);
        setConnectionState(WebSocketConnectionState.CLOSED);
      },
    });

    // Connect the WebSocket
    manager.connect().catch((error) => {
      logger.log(LogLevel.ERROR, 'Failed to connect WebSocket', LogLabel.SYSTEM, ServiceName.FRONTEND, { error });
      setConnectionState(WebSocketConnectionState.CLOSED);
    });

    // Update initial connection state
    const updateState = () => {
      const state = manager.getReadyState();
      switch (state) {
        case WebSocketState.CONNECTING:
          setConnectionState(WebSocketConnectionState.CONNECTING);
          break;
        case WebSocketState.OPEN:
          setSocket(manager.getSocket());
          setConnectionState(WebSocketConnectionState.OPEN);
          break;
        case WebSocketState.CLOSING:
          setConnectionState(WebSocketConnectionState.CLOSING);
          break;
        case WebSocketState.CLOSED:
          setConnectionState(WebSocketConnectionState.CLOSED);
          break;
      }
    };

    updateState();

    return () => {
      removeCallback();
    };
  }, [url, reconnectInterval, maxReconnectAttempts]);

  // Function to send a message
  const sendMessage = useCallback(
    (message: unknown) => {
      if (managerRef.current) {
        managerRef.current.sendMessage(message);
      }
    },
    [],
  );

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (managerRef.current) {
      reconnectAttemptsRef.current = 0;
      setIsReconnected(false);
      managerRef.current.reconnect();
    }
  }, []);

  // Reset the reconnected flag
  const resetReconnectedFlag = useCallback(() => {
    setIsReconnected(false);
  }, []);

  // Context value
  const value: WebSocketContextType = {
    socket,
    connectionState,
    lastMessage,
    sendMessage,
    reconnect,
    isReconnected,
    resetReconnectedFlag,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
};
