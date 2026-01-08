import { logger } from '@/utils/prodLogger';
import { baseSepolia } from 'viem/chains';
import type { Chain } from 'viem';

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

// ============================================
// Chain Definitions - Single Source of Truth
// ============================================

// Mantle Sepolia Testnet
export const mantleSepolia = {
    id: 5001,
    name: 'Mantle Sepolia Testnet',
    nativeCurrency: { name: 'MANTLE', symbol: 'MANTLE', decimals: 18 },
    rpcUrls: {
        default: { http: [import.meta.env.VITE_RPC_URL || 'https://testnet.mantle.pub'] },
        public: { http: ['https://testnet.mantle.pub'] },
    },
    blockExplorers: {
        default: { name: 'Mantle Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.mantlescan.xyz' },
    },
    testnet: true,
} as const;

// Lisk Sepolia Testnet
export const liskSepolia = {
    id: 4202,
    name: 'Lisk Sepolia Testnet',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia-api.lisk.com'] },
        public: { http: ['https://rpc.sepolia-api.lisk.com'] },
    },
    blockExplorers: {
        default: { name: 'Lisk Blockscout', url: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia-blockscout.lisk.com' },
    },
    testnet: true,
} as const;

// Re-export baseSepolia from viem for convenience
export { baseSepolia };

// ============================================
// getViemChain - Maps chain ID to chain object
// ============================================
export const getViemChain = (chainId: number): Chain => {
    switch (chainId) {
        case 84532:
            return baseSepolia;
        case 5001:
            return mantleSepolia as unknown as Chain;
        case 4202:
            return liskSepolia as unknown as Chain;
        default:
            throw new Error(`Unsupported chain ID: ${chainId}`);
    }
};

// Get chain configuration from environment
const getChainConfigFromEnv = (): IChainConfig => {
    const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');
    const blockExplorerUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL || '';

    // Determine block explorer name based on chain ID
    const getExplorerName = (id: number): string => {
        switch (id) {
            case 84532: return 'BaseScan';
            case 5001: return 'Mantle Explorer';
            case 4202: return 'Lisk Blockscout';
            default: return 'Block Explorer';
        }
    };

    const getDefaultExplorerUrl = (id: number): string => {
        switch (id) {
            case 84532: return 'https://sepolia.basescan.org';
            case 5001: return 'https://sepolia.mantlescan.xyz';
            case 4202: return 'https://sepolia-blockscout.lisk.com';
            default: return 'https://sepolia.basescan.org';
        }
    };

    const blockExplorers = {
        [chainId]: {
            name: getExplorerName(chainId),
            url: blockExplorerUrl || getDefaultExplorerUrl(chainId)
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

