import { logger } from '@/utils/prodLogger';
import { ChainTypeConfig } from '@/configs/chainType';

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
    // Read chain ID from the correct env var based on chain type
    const chainId = ChainTypeConfig.isSolana
        ? parseInt(import.meta.env.VITE_SOLANA_CHAIN_ID || '101')
        : parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

    const blockExplorerUrl = ChainTypeConfig.isSolana
        ? (import.meta.env.VITE_SOLANA_EXPLORER_URL || 'https://solscan.io')
        : (import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.basescan.org');

    const explorerName = ChainTypeConfig.isSolana ? 'Solscan' : 'BaseScan';

    const blockExplorers = {
        [chainId]: {
            name: explorerName,
            url: blockExplorerUrl
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

    // Solscan requires ?cluster=devnet for non-mainnet
    if (ChainTypeConfig.isSolana) {
        const cluster: string = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
        const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
        return `${explorer.url}/tx/${txHash}${clusterParam}`;
    }

    return `${explorer.url}/tx/${txHash}`;
};
