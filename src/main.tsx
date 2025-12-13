// Polyfill Buffer for browser environment
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './globals.css';

// Hide loading screen once React is ready
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
  loadingScreen.classList.add('hidden');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);