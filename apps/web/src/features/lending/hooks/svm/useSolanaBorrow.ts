'use client';

/**
 * Solana Borrow Hook (Stub)
 *
 * TODO: Implement using Anchor + IDL for the Solana Lending program.
 * This stub mirrors the EVM useBorrow interface so components can
 * switch between chains without changing their code.
 */

import { useState, useCallback } from 'react';

export enum SolanaBorrowStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    BORROWING = 'borrowing',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaBorrowOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaBorrowParams {
    tokenMint: string;   // SPL token mint address
    amount: string;
    decimals: number;
}

export function useSolanaBorrow({ onSuccess, onError }: UseSolanaBorrowOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaBorrowStep>(SolanaBorrowStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const borrow = useCallback(async (_params: SolanaBorrowParams) => {
        setIsPending(true);
        setCurrentStep(SolanaBorrowStep.VALIDATING);
        setError(null);

        try {
            // TODO: Implement Anchor transaction
            // 1. Build instruction via program.methods.borrow(...)
            // 2. Send transaction via wallet.sendTransaction()
            // 3. Confirm transaction
            throw new Error('Solana borrow not yet implemented — requires Anchor IDL');
        } catch (err) {
            const borrowError = err instanceof Error ? err : new Error('Solana borrow failed');
            setError(borrowError);
            setCurrentStep(SolanaBorrowStep.ERROR);
            setIsPending(false);
            onError?.(borrowError);
        }
    }, [onError]);

    return {
        borrow,
        isPending,
        currentStep,
        error,
        txHash,
    };
}
