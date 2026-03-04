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

/** Session-scoped cache key so getBalance is called at most once per session per address */
const sessionKey = (address: string) => `faucet_checked_${address}`;

/**
 * Module-level in-flight set — prevents concurrent duplicate runs across multiple
 * hook instances (e.g. embedded + external wallet in ProvidersWithOnboarding).
 * Marked BEFORE the async call so concurrent renders skip immediately.
 */
const inFlight = new Set<string>();

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
    if (!address || !enabled) return;
    if (ChainTypeConfig.isEVM && !publicClient) return;
    if (ChainTypeConfig.isSolana && !solana?.connection) return;

    // Guard 1: sessionStorage (survives page refresh within the same tab session)
    if (sessionStorage.getItem(sessionKey(address)) === '1') return;

    // Guard 2: in-flight set prevents concurrent duplicate calls
    // (multiple hook instances or rapid re-renders before the async call completes)
    if (inFlight.has(address)) return;

    // Mark BEFORE the async call — any concurrent render will see this and skip
    inFlight.add(address);

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
          inFlight.delete(address);
          return; // Neither client available
        }

        setBalance(nativeBalance);

        if (nativeBalance === 0n) {
          console.log('Native token balance is 0, requesting from faucet...');

          const response = await requestNativeTokens(address, chainId);

          if (response.success) {
            console.log('Successfully requested native tokens:', response);
            sessionStorage.setItem(sessionKey(address), '1');
            setHasRequested(true);
          } else {
            console.error('Failed to request native tokens:', response.error);
            setError(response.error || 'Failed to request native tokens');
            inFlight.delete(address); // allow retry on failure
          }
        } else {
          console.log(`User already has native tokens, skipping faucet request for ${address}`);
          sessionStorage.setItem(sessionKey(address), '1');
          setHasRequested(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check balance';
        console.error('Error checking balance and requesting faucet:', err);
        setError(errorMessage);
        inFlight.delete(address); // allow retry on error
      } finally {
        setIsChecking(false);
      }
    };

    checkBalanceAndRequestFaucet();
  // hasRequested intentionally excluded — using inFlight ref to prevent re-run loops
   
  }, [address, chainId, enabled, publicClient, solana?.connection, requestNativeTokens]);

  const reset = () => {
    if (address) inFlight.delete(address);
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
