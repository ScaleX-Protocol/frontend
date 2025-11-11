import { ConnectedWallet } from "@privy-io/react-auth";
import type { Chain } from "wagmi/chains";

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
  supportedChains: readonly [Chain, ...Chain[]];
  supportedChainIds: Number[];
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
  supportedChains: readonly [Chain, ...Chain[]];
  supportedChainIds: number[];
  validationResult: ChainValidationResult;
  validateChain: (chainId: number) => ChainValidationResult;
  ensureValidChain: () => Promise<boolean>;
  currentChainId: number | undefined;
}
