/**
 * @scalex/config – Chain Configuration Factory
 *
 * Single source of truth for chain/network definitions.
 * Accepts a chain ID and returns a fully typed chain config — no hardcoding, no env reading.
 */

export interface IChainConfig {
  defaultChainId: number;
  supportedChainIds: number[];
  blockExplorers: {
    [chainId: number]: {
      name: string;
      url: string;
    };
  };
}

const EXPLORER_MAP: Record<number, { name: string; url: string }> = {
  84532: { name: 'BaseScan',     url: 'https://sepolia.basescan.org' },
  8453:  { name: 'BaseScan',     url: 'https://basescan.org' },
  4202:  { name: 'Lisk Sepolia', url: 'https://sepolia-blockscout.lisk.com' },
  5003:  { name: 'Mantle',       url: 'https://explorer.sepolia.mantle.xyz' },
  1135:  { name: 'Lisk',         url: 'https://blockscout.lisk.com' },
};

/**
 * Create a chain configuration for a given chain ID.
 * @param chainId - Chain ID (e.g. 84532 for Base Sepolia)
 * @param blockExplorerUrl - Optional override for the block explorer URL
 */
export const createChainConfig = (
  chainId: number,
  blockExplorerUrl?: string,
): IChainConfig => {
  const defaults = EXPLORER_MAP[chainId] ?? { name: 'Block Explorer', url: blockExplorerUrl ?? '' };
  return {
    defaultChainId: chainId,
    supportedChainIds: [chainId],
    blockExplorers: {
      [chainId]: {
        name: defaults.name,
        url: blockExplorerUrl ?? defaults.url,
      },
    },
  };
};

/**
 * Get the block explorer transaction URL for a given tx hash and chain.
 */
export const getBlockExplorerTxUrl = (
  txHash: string,
  chainConfig: IChainConfig,
  chainId?: number,
): string => {
  const targetChainId = chainId ?? chainConfig.defaultChainId;
  const explorer = chainConfig.blockExplorers[targetChainId];
  if (!explorer) return '#';
  return `${explorer.url}/tx/${txHash}`;
};
