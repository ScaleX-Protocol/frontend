/**
 * @scalex/types – Chain types
 * Environment-agnostic chain/network type definitions.
 */

export type ChainFamily = 'evm' | 'svm';

export enum EvmChainId {
  Ethereum = 1,
  Base = 8453,
  BaseSepolia = 84532,
  MantleSepolia = 5003,
  LiskSepolia = 4202,
  Lisk = 1135,
}

export interface EvmNetworkConfig {
  chainId: number;
  name: string;
  rpc: string;
  explorer?: string;
  isTestnet?: boolean;
}

export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

export interface SvmNetworkConfig {
  cluster: SolanaCluster;
  name: string;
  rpc: string;
  ws?: string;
}

export type ChainConfig = EvmNetworkConfig | SvmNetworkConfig;

export function isEvmNetworkConfig(c: ChainConfig): c is EvmNetworkConfig {
  return 'chainId' in c;
}

export function isSvmNetworkConfig(c: ChainConfig): c is SvmNetworkConfig {
  return 'cluster' in c;
}
