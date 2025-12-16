// Polyfill Buffer for browser environment
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Providers } from './providers/privyProvider';
import { WebSocketProvider } from './providers/websocketProvider';
import { AutoWebSocketSubscriptions } from './components/AutoWebSocketSubscriptions';
import { Endpoints } from './configs/endpoints';
import { initializeIndexerClient, initializeBackendClient } from '@scalex/api-client';
import './globals.css';

// Initialize API clients with endpoints
initializeIndexerClient(Endpoints.indexer);
initializeBackendClient(Endpoints.api);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <Providers>
        <WebSocketProvider url={Endpoints.websocket}>
          <AutoWebSocketSubscriptions />
          <RouterProvider router={router} />
        </WebSocketProvider>
      </Providers>
    </React.Suspense>
  </React.StrictMode>
);