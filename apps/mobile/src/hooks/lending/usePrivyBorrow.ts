/**
 * Solana borrow hook - uses Privy embedded Solana wallet.
 * Same pattern as usePrivyDeposit, usePrivyPlaceOrder.
 */
import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { PublicKey } from '@solana/web3.js';
import { buildBorrowIxs } from '~/src/lib/solana/lending';
import { sendTransactionViaPrivy } from '~/src/lib/solana/send-transaction';
import type { LendingTokenSymbol } from '~/src/lib/solana/lending';

export enum BorrowStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UsePrivyBorrowOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface BorrowParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  decimals?: number;
}

export function usePrivyBorrow({
  onSuccess,
  onError,
}: UsePrivyBorrowOptions = {}) {
  const { isReady, user } = usePrivy();
  const { getProvider, getAddress } = useSolanaProvider();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();

  const address = getAddress();

  const borrow = useCallback(
    async (params: BorrowParams) => {
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
          throw new Error('Invalid borrow amount');
        }

        const instructions = await buildBorrowIxs({
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
    borrow,
    isPending,
    error,
    hash,
    isAuthenticated: Boolean(isReady && user && address),
    address: address ?? undefined,
  };
}
