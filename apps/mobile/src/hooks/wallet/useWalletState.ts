import { useCallback, useMemo } from 'react';
import { baseSepolia } from 'viem/chains';
import type { WalletInfo, WalletStateReturn } from '@scalex/types';

/**
 * Mobile-specific wallet state hook
 *
 * NOTE: This is a stub implementation while Privy integration is disabled.
 * When re-enabling Privy, use @privy-io/expo instead of @privy-io/react-auth
 */
export function useWalletState(): WalletStateReturn {
  // Stub wallet info - replace with actual Privy implementation when enabled
  const embeddedWallet: WalletInfo = useMemo(
    () => ({
      wallet: undefined,
      address: 'Not Created',
      chainId: baseSepolia.id,
      validation: {
        isValid: true,
        needsSwitch: false,
      },
    }),
    [],
  );

  const externalWallet: WalletInfo = useMemo(
    () => ({
      wallet: undefined,
      address: 'Not Connected',
      chainId: baseSepolia.id,
      validation: {
        isValid: true,
        needsSwitch: false,
      },
    }),
    [],
  );

  const login = useCallback(async () => {
    console.log('[useWalletState] Login called - Privy is disabled');
    // TODO: Implement with @privy-io/expo when ready
  }, []);

  const logout = useCallback(async () => {
    console.log('[useWalletState] Logout called - Privy is disabled');
    // TODO: Implement with @privy-io/expo when ready
  }, []);

  const exportWallet = useCallback(async () => {
    console.log('[useWalletState] Export wallet called - Privy is disabled');
    // TODO: Implement with @privy-io/expo when ready
  }, []);

  const validateEmbeddedChain = useCallback(async () => {
    return true;
  }, []);

  const validateExternalChain = useCallback(async () => {
    return true;
  }, []);

  const validateAllChains = useCallback(async () => {
    // No-op for now
  }, []);

  return {
    isConnected: false,
    isReady: true,
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
