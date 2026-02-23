/**
 * Solana Configuration
 * Reads Solana-specific settings from VITE_ environment variables
 * 
 * Shared across all apps via @scalex/service-wallet
 */

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
    const cluster = (
        typeof import.meta !== 'undefined' && import.meta.env
            ? import.meta.env.VITE_SOLANA_CLUSTER
            : undefined
    ) || 'devnet';
    const chainId = `solana:${cluster}` as SolanaChainId;

    const rpcUrl = (
        typeof import.meta !== 'undefined' && import.meta.env
            ? import.meta.env.VITE_SOLANA_RPC_URL
            : undefined
    ) || 'https://api.devnet.solana.com';

    const wsUrl = (
        typeof import.meta !== 'undefined' && import.meta.env
            ? import.meta.env.VITE_SOLANA_WS_URL
            : undefined
    ) || 'wss://api.devnet.solana.com';

    const explorerUrl = (
        typeof import.meta !== 'undefined' && import.meta.env
            ? import.meta.env.VITE_SOLANA_EXPLORER_URL
            : undefined
    ) || 'https://explorer.solana.com';

    return {
        defaultCluster: cluster as SolanaCluster,
        chainId,
        rpcUrl,
        wsUrl,
        explorerUrl,
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
