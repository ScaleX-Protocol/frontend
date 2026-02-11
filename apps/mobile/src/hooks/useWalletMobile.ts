import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useMemo } from "react";

/**
 * Hook for managing Privy embedded Ethereum wallet state in mobile app
 *
 * Centralizes wallet logic to avoid scattered useState in components
 * Returns wallet address, connection status, and loading state
 *
 * @example
 * ```tsx
 * const { walletAddress, isWalletConnected, isReady } = useWalletMobile();
 *
 * if (!isReady) return <Loading />;
 * if (walletAddress) {
 *   // Use wallet address
 * }
 * ```
 */
export function useWalletMobile() {
  const { isReady, user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();

  // Get wallet address from first embedded wallet
  const walletAddress = useMemo(() => {
    if (!wallets || wallets.length === 0) {
      return null;
    }

    // Return address from the first wallet
    return wallets[0].address;
  }, [wallets]);

  // Check if wallet is connected (has at least one wallet)
  const isWalletConnected = useMemo(() => {
    return wallets && wallets.length > 0;
  }, [wallets]);

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  return {
    /**
     * Wallet address from embedded wallet
     * null if not connected
     */
    walletAddress,

    /**
     * Whether embedded wallet is connected (has wallets)
     */
    isWalletConnected,

    /**
     * Whether user is authenticated with Privy
     */
    isAuthenticated,

    /**
     * Whether Privy is ready
     */
    isReady,

    /**
     * Array of all embedded Ethereum wallets
     */
    wallets,
  };
}
