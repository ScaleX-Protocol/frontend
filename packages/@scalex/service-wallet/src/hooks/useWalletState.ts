import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import { baseSepolia } from 'viem/chains';
import { parseChainId } from '../utils/wallet.helper';
import type { WalletInfo, WalletStateReturn } from '@scalex/types';
import { useChainValidator } from './useChainValidator';

// Simple logger for platform-agnostic code
const logger = {
  error: (...args: any[]) => console.error(...args),
};

const DEFAULT_EMBEDDED_CHAIN_ID = baseSepolia.id;
const DEFAULT_EXTERNAL_CHAIN_ID = baseSepolia.id;

export function useWalletState(): WalletStateReturn {
  const { wallets, ready } = useWallets();
  const { authenticated, login, logout, exportWallet } = usePrivy();

  // Memoize wallet selections
  const embeddedWalletInstance = useMemo(() => wallets.find((w) => w.walletClientType === 'privy'), [wallets]);

  const externalWalletInstance = useMemo(() => wallets.find((w) => w.walletClientType !== 'privy'), [wallets]);

  // TEMPORARILY DISABLED: Chain validation calls wagmi hooks before WagmiProvider is ready
  // This was causing WagmiProviderNotFoundError in production
  // const embeddedChainValidator = useChainValidator(embeddedWalletInstance);
  // const externalChainValidator = useChainValidator(externalWalletInstance);

  // Provide default validation results until we refactor the architecture
  const defaultValidationResult = useMemo(() => ({
    isValid: true,
    needsSwitch: false,
  }), []);

  // Memoize wallet info objects
  const embeddedWallet: WalletInfo = useMemo(
    () => ({
      wallet: embeddedWalletInstance,
      address: embeddedWalletInstance?.address || 'Not Created',
      chainId: parseChainId(embeddedWalletInstance?.chainId) || DEFAULT_EMBEDDED_CHAIN_ID,
      validation: defaultValidationResult,
    }),
    [embeddedWalletInstance, defaultValidationResult],
  );

  const externalWallet: WalletInfo = useMemo(
    () => ({
      wallet: externalWalletInstance,
      address: externalWalletInstance?.address || 'Not Connected',
      chainId: parseChainId(externalWalletInstance?.chainId) || DEFAULT_EXTERNAL_CHAIN_ID,
      validation: defaultValidationResult,
    }),
    [externalWalletInstance, defaultValidationResult],
  );

  const isConnected = authenticated && embeddedWallet.address !== 'Not Created';

  // TEMPORARILY DISABLED: Validation functions
  // These reference the disabled chain validators
  // Memoize validation functions
  const validateEmbeddedChain = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
    // if (!embeddedWalletInstance) return false;
    // return embeddedChainValidator.ensureValidChain();
    return true; // Always return true until we refactor
  }, []);

  const validateExternalChain = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
    // if (!externalWalletInstance) return false;
    // return externalChainValidator.ensureValidChain();
    return true; // Always return true until we refactor
  }, []);

  // Manual validation function for both wallets
  const validateAllChains = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
    // try {
    //   await Promise.all([
    //     embeddedWalletInstance ? validateEmbeddedChain() : Promise.resolve(false),
    //     externalWalletInstance ? validateExternalChain() : Promise.resolve(false),
    //   ]);
    // } catch (error) {
    //   logger.error('Error validating chains', error, { hook: 'useWalletState' });
    // }
  }, []);

  return {
    isConnected,
    isReady: ready,
    embeddedWallet,
    externalWallet,
    login,
    logout,
    export: exportWallet,
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}
