import { logger } from '@/utils/prodLogger';

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

// Get chain configuration from environment
const getChainConfigFromEnv = (): IChainConfig => {
    const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');
    const blockExplorerUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL || '';

    // Base Sepolia
    const blockExplorers = {
        [chainId]: {
            name: chainId === 84532 ? 'BaseScan' : 'Block Explorer',
            url: blockExplorerUrl || 'https://sepolia.basescan.org'
        }
    };

    return {
        defaultChainId: chainId,
        supportedChainIds: [chainId],
        blockExplorers
    };
};

export const ChainConfig = getChainConfigFromEnv();

// Helper function to get block explorer URL for a transaction
export const getBlockExplorerTxUrl = (txHash: string, chainId?: number): string => {
    const targetChainId = chainId || ChainConfig.defaultChainId;
    const explorer = ChainConfig.blockExplorers[targetChainId];

    if (!explorer) {
        logger.warn(`No block explorer configured for chain ID ${targetChainId}`, {
            chainId: targetChainId,
            txHash: txHash
        });
        return '#';
    }

    return `${explorer.url}/tx/${txHash}`;
};
