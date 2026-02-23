'use client';

/**
 * Web-specific borrow hook — thin wrapper
 *
 * Connects the chain-agnostic `useBorrow` from `@scalex/service-lending`
 * with the web Privy transaction executor.
 */

import { useBorrow as useBorrowCore, type BorrowStep } from '@scalex/service-lending';
import { usePrivyTxExecutor } from '@/hooks/usePrivyTxExecutor';

export { BorrowStep } from '@scalex/service-lending';

interface UseBorrowOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function useBorrow({ onSuccess, onError }: UseBorrowOptions = {}) {
  const { executor, address, isReady } = usePrivyTxExecutor();

  return useBorrowCore({
    executor,
    address,
    isReady,
    onSuccess,
    onError,
  });
}
