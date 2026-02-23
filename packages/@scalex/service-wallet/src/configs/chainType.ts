/**
 * Chain Type Detection
 * Detects EVM or Solana mode from VITE_CHAIN_TYPE environment variable
 * 
 * Shared across all apps via @scalex/service-wallet
 */

export type ChainType = 'evm' | 'solana';

export function detectChainType(): ChainType {
    // Support both Vite (import.meta.env) environments
    const chainType =
        typeof import.meta !== 'undefined' && import.meta.env
            ? import.meta.env.VITE_CHAIN_TYPE
            : undefined;

    if (chainType === 'solana') {
        return 'solana';
    }

    // Default: EVM mode (backward compatibility)
    return 'evm';
}

export const ChainTypeConfig = {
    detected: detectChainType(),
    isEVM: detectChainType() === 'evm',
    isSolana: detectChainType() === 'solana',
} as const;
