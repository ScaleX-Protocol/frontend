import { useCallback, useState } from 'react';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
/**
 * Hook to get the Privy embedded Solana wallet provider.
 * Use this for signing transactions (signAndSendTransaction).
 */
export function useSolanaProvider() {
  const { wallets } = useEmbeddedSolanaWallet();
  const [error, setError] = useState<Error | null>(null);

  const getProvider = useCallback(async (): Promise<{ request: (args: { method: string; params?: unknown }) => Promise<unknown> } | null> => {
    try {
      setError(null);
      if (!wallets || wallets.length === 0) {
        throw new Error('No Solana wallet found. Please log in and ensure embedded wallet is created.');
      }
      const provider = await wallets[0].getProvider();
      return provider;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      return null;
    }
  }, [wallets]);

  const getAddress = useCallback((): string | null => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0].address ?? null;
  }, [wallets]);

  return {
    wallets,
    getProvider,
    getAddress,
    address: getAddress(),
    hasWallet: Boolean(wallets && wallets.length > 0),
    error,
  };
}
