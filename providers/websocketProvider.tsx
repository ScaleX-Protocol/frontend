'use client';

import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnected, setIsReconnected] = useState(false);

  // Use refs to avoid circular dependency and stale closures
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);

  // Function to handle reconnection
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      setConnectionState(WebSocketConnectionState.RECONNECTING);
      reconnectAttemptsRef.current += 1;
      setReconnectAttempts(reconnectAttemptsRef.current);

      setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        createWebSocket();
      }, reconnectInterval);
    } else {
      console.error(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
      setConnectionState(WebSocketConnectionState.CLOSED);
    }
  }, [maxReconnectAttempts, reconnectInterval]);

  // Function to create a new WebSocket connection
  const createWebSocket = useCallback(() => {
    try {
      // Close existing socket if any
      if (socketRef.current) {
        isIntentionalCloseRef.current = true;
        socketRef.current.close();
      }

      const newSocket = new WebSocket(url);
      socketRef.current = newSocket;
      isIntentionalCloseRef.current = false;

      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionState(WebSocketConnectionState.OPEN);
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);

        // If this was a reconnection, set the reconnected flag
        const wasReconnecting = reconnectAttemptsRef.current > 0;
        if (wasReconnecting) {
          setIsReconnected(true);
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setLastMessage(parsedData);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setLastMessage(event.data);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket connection closed');

        // Only attempt reconnection if it wasn't an intentional close
        if (!isIntentionalCloseRef.current) {
          setConnectionState(WebSocketConnectionState.CLOSED);
          handleReconnect();
        } else {
          setConnectionState(WebSocketConnectionState.CLOSED);
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(newSocket);
      setConnectionState(WebSocketConnectionState.CONNECTING);

      return newSocket;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionState(WebSocketConnectionState.CLOSED);
      return null;
    }
  }, [url, handleReconnect]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      isIntentionalCloseRef.current = true;
      socketRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    createWebSocket();
  }, [createWebSocket]);

  // Function to send a message
  const sendMessage = useCallback(
    (message: unknown) => {
      if (socket && connectionState === WebSocketConnectionState.OPEN) {
        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        socket.send(messageString);
      } else {
        console.error('Cannot send message, WebSocket is not connected');
      }
    },
    [socket, connectionState],
  );

  // Reset the reconnected flag
  const resetReconnectedFlag = useCallback(() => {
    setIsReconnected(false);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    createWebSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        isIntentionalCloseRef.current = true;
        setConnectionState(WebSocketConnectionState.CLOSING);
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // Only recreate connection when URL changes, not when createWebSocket changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
