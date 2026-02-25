/**
 * Chain Configuration
 * Reads chain ID from environment variables based on chain type.
 *
 * EVM mode:    reads VITE_CHAIN_ID (e.g., 84532 for Base Sepolia)
 * Solana mode: reads VITE_SOLANA_CHAIN_ID (e.g., 101 for devnet)
 *
 * Shared across all apps via @scalex/service-wallet
 */

import { ChainTypeConfig } from './chainType';

// Simple logger for platform-agnostic code
const logger = {
    warn: (...args: any[]) => console.warn(...args),
};

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

const getChainIdFromEnv = (): number => {
    const raw = ChainTypeConfig.isSolana
        ? import.meta.env?.VITE_SOLANA_CHAIN_ID
        : import.meta.env?.VITE_CHAIN_ID;
    return raw ? parseInt(raw, 10) : (ChainTypeConfig.isSolana ? 101 : 84532);
};

const getBlockExplorers = () => {
    const chainId = getChainIdFromEnv();

    if (ChainTypeConfig.isSolana) {
        const explorerUrl = import.meta.env?.VITE_SOLANA_EXPLORER_URL || 'https://solscan.io';
        return {
            [chainId]: {
                name: 'Solscan',
                url: explorerUrl,
            },
        };
    }

    return {
        [chainId]: {
            name: 'BaseScan',
            url: import.meta.env?.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.basescan.org',
        },
    };
};

export const ChainConfig: IChainConfig = {
    defaultChainId: getChainIdFromEnv(),
    supportedChainIds: [getChainIdFromEnv()],
    blockExplorers: getBlockExplorers(),
};

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
        const cluster: string = import.meta.env?.VITE_SOLANA_CLUSTER || 'devnet';
        const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
        return `${explorer.url}/tx/${txHash}${clusterParam}`;
    }

    return `${explorer.url}/tx/${txHash}`;
};

