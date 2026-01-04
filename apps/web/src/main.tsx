// Polyfill Buffer for browser environment
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Providers } from './providers/privyProvider';
import { initializeIndexerClient, initializeBackendClient } from '@scalex/api-client';
import { Endpoints } from './configs/endpoints';
import './globals.css';

// Initialize API clients with endpoints
initializeIndexerClient(Endpoints.indexer);
initializeBackendClient(Endpoints.api);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </React.Suspense>
  </React.StrictMode>
);