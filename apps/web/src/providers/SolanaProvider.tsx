'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Connection } from '@solana/web3.js';
import { SolanaConfig, type SolanaCluster, type SolanaChainId } from '@/configs/solana';
import { ChainTypeConfig } from '@/configs/chainType';

/**
 * Solana Context Value Interface
 * Provides Solana connection and cluster information
 */
interface SolanaContextValue {
  /** Solana RPC connection instance */
  connection: Connection;
  /** Current cluster (devnet, mainnet, testnet) */
  cluster: SolanaCluster;
  /** Solana chain ID format (solana:devnet) */
  chainId: SolanaChainId;
  /** RPC URL being used */
  rpcUrl: string;
  /** WebSocket URL for subscriptions */
  wsUrl: string;
  /** Explorer base URL */
  explorerUrl: string;
  /** Whether we're on mainnet */
  isMainnet: boolean;
  /** Whether we're on devnet */
  isDevnet: boolean;
}

const SolanaContext = createContext<SolanaContextValue | null>(null);

interface SolanaProviderProps {
  children: ReactNode;
}

/**
 * SolanaProvider - Provides Solana RPC connection to the app
 *
 * This provider:
 * 1. Creates a singleton Connection instance using the configured RPC
 * 2. Exposes cluster info and helper flags
 * 3. Only provides actual connection when VITE_CHAIN_TYPE === 'solana'
 *
 * Usage:
 * ```tsx
 * const { connection, cluster } = useSolana();
 * const balance = await connection.getBalance(publicKey);
 * ```
 */
export function SolanaProvider({ children }: SolanaProviderProps) {
  // Create memoized connection and context value
  const value = useMemo((): SolanaContextValue => {
    const connection = new Connection(SolanaConfig.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: SolanaConfig.wsUrl,
    });

    return {
      connection,
      cluster: SolanaConfig.defaultCluster,
      chainId: SolanaConfig.chainId,
      rpcUrl: SolanaConfig.rpcUrl,
      wsUrl: SolanaConfig.wsUrl,
      explorerUrl: SolanaConfig.explorerUrl,
      isMainnet: SolanaConfig.defaultCluster === 'mainnet',
      isDevnet: SolanaConfig.defaultCluster === 'devnet',
    };
  }, []);

  return (
    <SolanaContext.Provider value={value}>
      {children}
    </SolanaContext.Provider>
  );
}

/**
 * useSolana - Hook to access Solana connection and cluster info
 *
 * @throws Error if used outside of SolanaProvider or in EVM mode
 *
 * @example
 * ```tsx
 * const { connection, cluster, isDevnet } = useSolana();
 *
 * // Get balance
 * const balance = await connection.getBalance(publicKey);
 *
 * // Check cluster
 * if (isDevnet) {
 *   console.log('Running on devnet');
 * }
 * ```
 */
export function useSolana(): SolanaContextValue {
  const context = useContext(SolanaContext);

  if (!context) {
    throw new Error(
      'useSolana must be used within a SolanaProvider. ' +
      'Make sure you are in Solana mode (VITE_CHAIN_TYPE=solana) and ' +
      'the component is wrapped with SolanaProvider.'
    );
  }

  return context;
}

/**
 * useSolanaSafe - Safe version of useSolana that returns null in EVM mode
 * Use this when you need to conditionally access Solana context
 *
 * @example
 * ```tsx
 * const solana = useSolanaSafe();
 * if (solana) {
 *   const balance = await solana.connection.getBalance(publicKey);
 * }
 * ```
 */
export function useSolanaSafe(): SolanaContextValue | null {
  const context = useContext(SolanaContext);
  return context;
}

/**
 * Conditional wrapper that only renders SolanaProvider in Solana mode
 * Use this at the app root level to conditionally provide Solana context
 */
export function SolanaProviderConditional({ children }: SolanaProviderProps) {
  // Only wrap with SolanaProvider when in Solana mode
  if (ChainTypeConfig.isSolana) {
    return <SolanaProvider>{children}</SolanaProvider>;
  }

  // In EVM mode, just render children without Solana context
  return <>{children}</>;
}

export { SolanaContext };
