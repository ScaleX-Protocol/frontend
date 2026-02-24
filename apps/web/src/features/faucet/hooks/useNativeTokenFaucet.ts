'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useFaucet } from '@/features/faucet/hooks/useFaucet';
import { ChainConfig } from '@/configs/chain';
import { ChainTypeConfig } from '@/configs/chainType';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import { PublicKey } from '@solana/web3.js';

interface UseNativeTokenFaucetOptions {
  address?: string;
  chainId?: number;
  enabled?: boolean;
}

export function useNativeTokenFaucet({ address, chainId = ChainConfig.defaultChainId, enabled = true }: UseNativeTokenFaucetOptions) {
  // EVM: use wagmi public client (safe to call — returns undefined in Solana mode)
  const publicClient = usePublicClient({ chainId: ChainTypeConfig.isEVM ? chainId : undefined });
  // Solana: use Connection from SolanaProvider (returns null in EVM mode)
  const solana = useSolanaSafe();

  const { requestNativeTokens } = useFaucet();
  const [isChecking, setIsChecking] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !enabled || hasRequested) {
      return;
    }

    // EVM mode: need wagmi publicClient
    // Solana mode: need solana connection
    if (ChainTypeConfig.isEVM && !publicClient) return;
    if (ChainTypeConfig.isSolana && !solana?.connection) return;

    const checkBalanceAndRequestFaucet = async () => {
      try {
        setIsChecking(true);
        setError(null);

        let nativeBalance: bigint;

        if (ChainTypeConfig.isSolana && solana?.connection) {
          // Solana: use Connection.getBalance()
          const pubkey = new PublicKey(address);
          const lamports = await solana.connection.getBalance(pubkey);
          nativeBalance = BigInt(lamports);
        } else if (publicClient) {
          // EVM: use wagmi publicClient.getBalance()
          nativeBalance = await publicClient.getBalance({ address: address as `0x${string}` });
        } else {
          return; // Neither client available
        }

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
          console.log(`User already has native tokens, skipping faucet request for ${address}`);
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
  }, [address, chainId, enabled, hasRequested, publicClient, solana?.connection, requestNativeTokens]);

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

