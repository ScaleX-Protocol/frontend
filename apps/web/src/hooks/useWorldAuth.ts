import { MiniKit } from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import { useLoginWithSiwe } from '@privy-io/react-auth';
import { useWorldMiniKit } from '@/providers/WorldMiniKitProvider';

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

export function useWorldAuth() {
  const { isInWorldApp } = useWorldMiniKit();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      throw new Error('Not running inside World App');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Step 1: Get wallet address — use cached value or do a quick pre-auth
      let walletAddress = MiniKit.walletAddress;

      if (!walletAddress) {
        const tempNonce = crypto.randomUUID().replace(/-/g, '');
        const { finalPayload: temp } = await MiniKit.commandsAsync.walletAuth({
          nonce: tempNonce,
          statement: 'Connect your World App wallet to ScaleX.',
        });
        if (temp.status === 'error') throw new Error('Failed to retrieve World App wallet address');
        walletAddress = temp.address;
      }

      // Step 2: Get a Privy-server-issued SIWE challenge so the nonce is registered
      const siweMessage = await generateSiweMessage({
        address: walletAddress as `0x${string}`,
        chainId: CHAIN_ID,
      });

      // Step 3: Extract Privy's nonce from the EIP-4361 message string
      const nonceMatch = siweMessage.match(/^Nonce: (.+)$/m);
      if (!nonceMatch?.[1]) throw new Error('Could not extract nonce from Privy SIWE challenge');
      const privyNonce = nonceMatch[1].trim();

      // Step 4: Sign with World App using the Privy-issued nonce
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: privyNonce,
        statement: 'Sign in to ScaleX Exchange.',
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        notBefore: new Date(Date.now() - 5000),
      });

      if (finalPayload.status === 'error') {
        throw new Error('World App wallet authentication failed');
      }

      // Step 5: Login with Privy using MiniKit's signed SIWE message
      await loginWithSiwe({
        message: finalPayload.message,
        signature: finalPayload.signature as string,
      });

      return finalPayload.address;
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setError(message);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [generateSiweMessage, loginWithSiwe]);

  return {
    authenticate,
    isAuthenticating,
    isWorldApp: isInWorldApp,
    error,
    clearError: () => setError(null),
  };
}
