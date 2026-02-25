/**
 * Solana repay hook - uses Privy embedded Solana wallet.
 * Same pattern as usePrivyDeposit, usePrivyPlaceOrder.
 */
import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { PublicKey } from '@solana/web3.js';
import { buildRepayIxs } from '~/src/lib/solana/lending';
import { sendTransactionViaPrivy } from '~/src/lib/solana/send-transaction';
import type { LendingTokenSymbol } from '~/src/lib/solana/lending';

export enum RepayStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UsePrivyRepayOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface RepayParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  decimals?: number;
}

export function usePrivyRepay({
  onSuccess,
  onError,
}: UsePrivyRepayOptions = {}) {
  const { isReady, user } = usePrivy();
  const { getProvider, getAddress } = useSolanaProvider();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();

  const address = getAddress();

  const repay = useCallback(
    async (params: RepayParams) => {
      try {
        setError(null);
        setIsPending(true);

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No Solana wallet. Please log in.');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }

        const amountNum = parseFloat(params.amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
          throw new Error('Invalid repay amount');
        }

        const instructions = await buildRepayIxs({
          tokenSymbol: params.tokenSymbol,
          amount: params.amount,
          owner: new PublicKey(address),
          decimals: params.decimals,
        });

        const signature = await sendTransactionViaPrivy({
          instructions,
          feePayer: new PublicKey(address),
          provider,
        });

        setHash(signature);
        setIsPending(false);
        onSuccess?.(signature);
        return signature;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setIsPending(false);
        onError?.(e);
        throw e;
      }
    },
    [getProvider, address, onSuccess, onError]
  );

  return {
    repay,
    isPending,
    error,
    hash,
    isAuthenticated: Boolean(isReady && user && address),
    address: address ?? undefined,
  };
}
