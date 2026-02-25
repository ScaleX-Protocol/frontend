import { MiniKit } from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import { useLoginWithSiwe } from '@privy-io/react-auth';
import { useWorldMiniKit } from '@/providers/WorldMiniKitProvider';

export function useWorldAuth() {
  const { isInWorldApp } = useWorldMiniKit();
  const { loginWithSiwe } = useLoginWithSiwe();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      throw new Error('Not running inside World App');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Nonce must be alphanumeric and at least 8 chars (World App requirement)
      const nonce = crypto.randomUUID().replace(/-/g, '');

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        statement: 'Sign in to ScaleX Exchange.',
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        notBefore: new Date(Date.now() - 5000),
      });

      if (finalPayload.status === 'error') {
        throw new Error('World App wallet authentication failed');
      }

      // Use Privy's SIWE login with the MiniKit-signed SIWE message
      await loginWithSiwe({
        message: finalPayload.message,
        signature: finalPayload.signature as string,
        walletClientType: 'world_app',
        connectorType: 'injected',
      });

      return finalPayload.address;
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setError(message);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [loginWithSiwe]);

  return {
    authenticate,
    isAuthenticating,
    isWorldApp: isInWorldApp,
    error,
    clearError: () => setError(null),
  };
}
