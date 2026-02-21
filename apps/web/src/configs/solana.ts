export type SolanaCluster = 'mainnet' | 'devnet' | 'testnet';
export type SolanaChainId = 'solana:mainnet' | 'solana:devnet' | 'solana:testnet';

export interface ISolanaConfig {
  defaultCluster: SolanaCluster;
  chainId: SolanaChainId;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
}

const getSolanaConfigFromEnv = (): ISolanaConfig => {
  const cluster = (import.meta.env.VITE_SOLANA_CLUSTER || 'devnet') as SolanaCluster;
  const chainId = `solana:${cluster}` as SolanaChainId;

  return {
    defaultCluster: cluster,
    chainId,
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    wsUrl: import.meta.env.VITE_SOLANA_WS_URL || 'wss://api.devnet.solana.com',
    explorerUrl: import.meta.env.VITE_SOLANA_EXPLORER_URL || 'https://explorer.solana.com',
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
