export type SolanaCluster = 'mainnet' | 'devnet' | 'testnet';
export type SolanaChainId = 'solana:mainnet' | 'solana:devnet' | 'solana:testnet';

export interface ISolanaConfig {
  defaultCluster: SolanaCluster;
  chainId: SolanaChainId;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  /** Fallback RPC URLs tried in order when the primary is rate-limited */
  fallbackRpcUrls: string[];
  /** Public RPC for Privy internal calls — keeps Helius quota for app data queries */
  privyRpcUrl: string;
  privyWsUrl: string;
}

const getSolanaConfigFromEnv = (): ISolanaConfig => {
  const cluster = (import.meta.env.VITE_SOLANA_CLUSTER || 'devnet') as SolanaCluster;
  const chainId = `solana:${cluster}` as SolanaChainId;

  const primaryRpc = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const fallbackRpcUrls = import.meta.env.VITE_SOLANA_FALLBACK_RPC_URLS
    ? (import.meta.env.VITE_SOLANA_FALLBACK_RPC_URLS as string)
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u && u !== primaryRpc)
    : ['https://api.devnet.solana.com'];

  return {
    defaultCluster: cluster,
    chainId,
    rpcUrl: primaryRpc,
    wsUrl: import.meta.env.VITE_SOLANA_WS_URL || 'wss://api.devnet.solana.com',
    explorerUrl: import.meta.env.VITE_SOLANA_EXPLORER_URL || 'https://solscan.io',
    fallbackRpcUrls,
    privyRpcUrl: import.meta.env.VITE_PRIVY_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    privyWsUrl: import.meta.env.VITE_PRIVY_SOLANA_WS_URL || 'wss://api.devnet.solana.com',
  };
};

export const SolanaConfig = getSolanaConfigFromEnv();

export const getClusterFromChainId = (chainId: SolanaChainId): SolanaCluster => {
  return chainId.replace('solana:', '') as SolanaCluster;
};

export const getExplorerUrl = (address: string, type: 'address' | 'tx' = 'address'): string => {
  const cluster = SolanaConfig.defaultCluster;
  const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `${SolanaConfig.explorerUrl}/${type}/${address}${clusterParam}`;
};

/** Convenience wrapper — same signature as EVM getBlockExplorerTxUrl */
export const getSolanaExplorerTxUrl = (txSignature: string): string =>
  getExplorerUrl(txSignature, 'tx');
