'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useFaucet } from '@/features/faucet/hooks/useFaucet';

interface UseNativeTokenFaucetOptions {
  address?: string;
  chainId?: number;
  enabled?: boolean;
}

export function useNativeTokenFaucet({ address, chainId = baseSepolia.id, enabled = true }: UseNativeTokenFaucetOptions) {
  const publicClient = usePublicClient({ chainId });
  const { requestNativeTokens } = useFaucet();
  const [isChecking, setIsChecking] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !enabled || hasRequested || !publicClient) {
      return;
    }

    const checkBalanceAndRequestFaucet = async () => {
      try {
        setIsChecking(true);
        setError(null);

        const nativeBalance = await publicClient.getBalance({ address: address as `0x${string}` });
        setBalance(nativeBalance);

        if (nativeBalance === 0n) {
          console.log('Native token balance is 0, requesting from faucet...');

          const response = await requestNativeTokens(address, chainId);

          if (response.success) {
            console.log('Successfully requested native tokens:', response);
            setHasRequested(true);
          } else {
            console.error('Failed to request native tokens:', response.error);
            setError(response.error || 'Failed to request native tokens');
          }
        } else {
            }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check balance';
        console.error('Error checking balance and requesting faucet:', err);
        setError(errorMessage);
      } finally {
        setIsChecking(false);
      }
    };

    checkBalanceAndRequestFaucet();
  }, [address, chainId, enabled, hasRequested, publicClient, requestNativeTokens]);

  const reset = () => {
    setHasRequested(false);
    setBalance(null);
    setError(null);
  };

  return {
    isChecking,
    hasRequested,
    balance,
    error,
    reset,
  };
}
