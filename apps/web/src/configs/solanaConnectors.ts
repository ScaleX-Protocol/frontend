/**
 * Solana wallet connectors for Privy
 * Handles external Solana wallet detection (Phantom, Solflare, Backpack, etc.)
 */

import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export type SolanaConnectorsConfig = ReturnType<typeof toSolanaWalletConnectors>;

/**
 * Get Solana wallet connectors
 * No caching - creates fresh connectors to avoid race conditions with async extension injection
 */
export function getSolanaConnectors(): SolanaConnectorsConfig {
  return toSolanaWalletConnectors({
    shouldAutoConnect: false,
  });
}
