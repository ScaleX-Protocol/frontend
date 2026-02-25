/**
 * apps/mobile – Configuration
 *
 * Single source of truth for the mobile app.
 * Reads EXPO_PUBLIC_* env vars and calls @scalex/config factories.
 * Import from here — never reach into packages directly.
 *
 * Initialize API clients by calling initializeApiClients() once at app startup
 * (already done in src/providers/index.tsx).
 */

import { createEndpoints } from '@scalex/config';
import { initializeBackendClient, initializeIndexerClient } from '@scalex/api-client';

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const Endpoints = createEndpoints({
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://solana-devnet-indexer.scalex.money',
  indexerUrl: process.env.EXPO_PUBLIC_INDEXER_URL || 'https://solana-devnet-indexer.scalex.money',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://solana-devnet-websocket.scalex.money',
});

// ─── API client initializer ───────────────────────────────────────────────────
/**
 * Initialize the global @scalex/api-client singletons.
 * Call this once during app bootstrap (e.g., in providers.tsx before any hooks run).
 */
export function initializeApiClients(): void {
  initializeIndexerClient(Endpoints.indexerUrl);
  initializeBackendClient(Endpoints.apiUrl);
}
