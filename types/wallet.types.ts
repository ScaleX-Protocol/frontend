import type { ConnectedWallet } from '@privy-io/react-auth';

export interface WalletInfo {
  wallet: ConnectedWallet | undefined;
  address: string;
  chainId: number;
  validation: ChainValidationResult;
}

export interface WalletStateReturn {
  isReady: boolean;
  embeddedWallet: WalletInfo;
  externalWallet: WalletInfo;
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
