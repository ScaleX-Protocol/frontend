/**
 * Chain Type Detection
 * Detects EVM or Solana mode from VITE_CHAIN_TYPE environment variable
 */

export type ChainType = 'evm' | 'solana';

/**
 * Detect chain type from environment variables
 *
 * Primary: VITE_CHAIN_TYPE ('evm' | 'solana')
 * Fallback: Default to 'evm' for backward compatibility
 */
export function detectChainType(): ChainType {
  const chainType = import.meta.env.VITE_CHAIN_TYPE;

  if (chainType === 'solana') {
    return 'solana';
  }

  // Default: EVM mode (backward compatibility)
  return 'evm';
}

/**
 * Check if current environment is EVM mode
 */
export function isEVMMode(): boolean {
  return detectChainType() === 'evm';
}

/**
 * Check if current environment is Solana mode
 */
export function isSolanaMode(): boolean {
  return detectChainType() === 'solana';
}

/**
 * Get chain type configuration
 */
export const ChainTypeConfig = {
  detected: detectChainType(),
  isEVM: isEVMMode(),
  isSolana: isSolanaMode(),
} as const;
