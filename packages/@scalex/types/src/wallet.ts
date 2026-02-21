import type { ConnectedWallet } from '@privy-io/react-auth';

export interface WalletInfo {
  wallet: ConnectedWallet | undefined;
  address: string;
  chainId: number;
  validation: ChainValidationResult;
}

// Solana wallet info uses string chainId (e.g., 'solana:devnet')
export interface SolanaWalletInfo {
  wallet: unknown | undefined;
  address: string;
  chainId: string;
}

/**
 * Original EVM-only wallet state return type
 * Used when VITE_CHAIN_ID is set (EVM mode)
 */
export interface EVMWalletStateReturn {
  isConnected: boolean;
  isReady: boolean;
  embeddedWallet: WalletInfo;
  externalWallet: WalletInfo;
  login: () => void;
  logout: () => void;
  export: () => void;
  validateEmbeddedChain: () => Promise<boolean>;
  validateExternalChain: () => Promise<boolean>;
  validateAllChains: () => Promise<void>;
}

/**
 * Solana wallet state return type
 * Used when VITE_SOLANA_CLUSTER is set (Solana mode)
 */
export interface SolanaWalletStateReturn {
  isConnected: boolean;
  isReady: boolean;
  embeddedSolanaWallet: SolanaWalletInfo;
  externalSolanaWallet: SolanaWalletInfo;
  login: () => void;
  logout: () => void;
  export: () => void;
  validateEmbeddedChain: () => Promise<boolean>;
  validateExternalChain: () => Promise<boolean>;
  validateAllChains: () => Promise<void>;
}

/**
 * Unified wallet state return type (supports both EVM and Solana)
 * This is the main type used by useWalletState()
 */
export interface WalletStateReturn {
  isConnected: boolean;
  isReady: boolean;
  // EVM wallets (active in EVM mode, stub in Solana mode)
  embeddedWallet: WalletInfo;
  externalWallet: WalletInfo;
  // Solana wallets (active in Solana mode, stub in EVM mode)
  embeddedSolanaWallet: SolanaWalletInfo;
  externalSolanaWallet: SolanaWalletInfo;
  // Auth functions
  login: () => void;
  logout: () => void;
  export: () => void;
  // Validation
  validateEmbeddedChain: () => Promise<boolean>;
  validateExternalChain: () => Promise<boolean>;
  validateAllChains: () => Promise<void>;
}

export interface ChainValidationResult {
  isValid: boolean;
  needsSwitch: boolean;
  currentChainId?: number;
}

export interface ChainValidatorReturn {
  validationResult: ChainValidationResult;
  ensureValidChain: () => Promise<boolean>;
}
