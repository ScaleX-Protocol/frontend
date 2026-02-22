/**
 * @scalex/types – Wallet types
 *
 * Platform-agnostic wallet types. No imports from platform-specific SDKs
 * (@privy-io/react-auth or @privy-io/expo) — those are consumed at the app level.
 */

export interface WalletInfo {
  /** Raw wallet instance — typed as `any` to stay platform-agnostic (ConnectedWallet on web, SolanaWallet/EthWallet on mobile) */
  wallet: any | undefined;
  address: string;
  chainId: number;
  validation: ChainValidationResult;
}

export interface WalletStateReturn {
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

export interface ChainValidationResult {
  isValid: boolean;
  needsSwitch: boolean;
  currentChainId?: number;
}

export interface ChainValidatorReturn {
  validationResult: ChainValidationResult;
  ensureValidChain: () => Promise<boolean>;
}
