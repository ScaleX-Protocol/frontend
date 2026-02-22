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

import { createChainConfig, createContracts, createEndpoints } from '@scalex/config';
import type { HexAddress } from '@scalex/config';
import { initializeBackendClient, initializeIndexerClient } from '@scalex/api-client';

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const Endpoints = createEndpoints({
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://solana-devnet-indexer.scalex.money',
  indexerUrl: process.env.EXPO_PUBLIC_INDEXER_URL || 'https://solana-devnet-indexer.scalex.money',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://solana-devnet-websocket.scalex.money',
});

// ─── Chain ────────────────────────────────────────────────────────────────────
export const ChainConfig = createChainConfig(
  Number(process.env.EXPO_PUBLIC_CHAIN_ID || 101),
);

// ─── Contracts ────────────────────────────────────────────────────────────────
export const Contracts = createContracts(ChainConfig.defaultChainId, {
  balanceManagerAddress: (process.env.EXPO_PUBLIC_BALANCE_MANAGER_CONTRACT || '0xCe3C3b216dC2A3046bE3758Fa42729bca54b2b89') as HexAddress,
  scaleXRouterAddress: (process.env.EXPO_PUBLIC_SCALEX_ROUTER_CONTRACT || '0x7D6657eB26636D2007be6a058b1fc4F50919142c') as HexAddress,
  poolManagerAddress: (process.env.EXPO_PUBLIC_POOL_MANAGER_CONTRACT || '0xE3D7C79608eBd053f082973f4edE2c817bF864D5') as HexAddress,
});

// ─── API client initializer ───────────────────────────────────────────────────
/**
 * Initialize the global @scalex/api-client singletons.
 * Call this once during app bootstrap (e.g., in providers.tsx before any hooks run).
 */
export function initializeApiClients(): void {
  initializeIndexerClient(Endpoints.indexer);
  initializeBackendClient(Endpoints.api);
}
