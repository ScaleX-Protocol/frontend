// Polyfill Buffer for browser environment
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Providers } from './providers/privyProvider';
import { WebSocketProvider } from './providers/websocketProvider';
import { Endpoints } from './configs/endpoints';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <WebSocketProvider url={Endpoints.websocket}>
        <RouterProvider router={router} />
      </WebSocketProvider>
    </Providers>
  </React.StrictMode>
);