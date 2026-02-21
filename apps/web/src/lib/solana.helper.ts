import { Connection, clusterApiUrl, type Cluster } from '@solana/web3.js';
import { SolanaConfig, type SolanaCluster, type SolanaChainId } from '@/configs/solana';

/**
 * Get Solana connection for the configured cluster
 */
export const getSolanaConnection = (cluster?: SolanaCluster): Connection => {
  const targetCluster = cluster || SolanaConfig.defaultCluster;
  const rpcUrl = targetCluster === SolanaConfig.defaultCluster
    ? SolanaConfig.rpcUrl
    : clusterApiUrl(targetCluster as Cluster);

  return new Connection(rpcUrl, 'confirmed');
};

/**
 * Parse Solana chain ID to cluster name
 * 'solana:devnet' -> 'devnet'
 */
export const parseSolanaChainId = (chainId: string): SolanaCluster => {
  return chainId.replace('solana:', '') as SolanaCluster;
};

/**
 * Create Solana chain ID from cluster name
 * 'devnet' -> 'solana:devnet'
 */
export const createSolanaChainId = (cluster: SolanaCluster): SolanaChainId => {
  return `solana:${cluster}` as SolanaChainId;
};

/**
 * Check if an address is a valid Solana address (base58, 32-44 chars)
 */
export const isValidSolanaAddress = (address: string): boolean => {
  // Solana addresses are base58 encoded and 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

/**
 * Check if an address is an EVM address (0x prefix, 42 chars)
 */
export const isValidEVMAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Detect address type
 */
export const detectAddressType = (address: string): 'evm' | 'solana' | 'unknown' => {
  if (isValidEVMAddress(address)) return 'evm';
  if (isValidSolanaAddress(address)) return 'solana';
  return 'unknown';
};

/**
 * Shorten Solana address for display
 */
export const shortenSolanaAddress = (address: string, chars = 4): string => {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Get Solana explorer URL for an address or transaction
 */
export const getSolanaExplorerUrl = (
  hash: string,
  type: 'address' | 'tx' = 'address'
): string => {
  const cluster = SolanaConfig.defaultCluster;
  const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `${SolanaConfig.explorerUrl}/${type}/${hash}${clusterParam}`;
};
