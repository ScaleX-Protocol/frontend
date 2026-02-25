'use client';

/**
 * Solana Token Approval Hook (Stub)
 *
 * NOTE: Solana SPL tokens don't use the ERC20 approval pattern.
 * Instead, Solana programs use Associated Token Accounts (ATAs) and
 * delegate authority. This stub exists for interface symmetry —
 * on Solana, "approval" may translate to creating an ATA or
 * setting a delegate via spl-token's approve instruction.
 *
 * TODO: Implement if the Solana program requires delegate authority.
 */

import { useState, useCallback } from 'react';

interface UseSolanaTokenApprovalOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaApprovalParams {
    tokenMint: string;   // SPL token mint address
    amount: string;
    decimals: number;
}

export function useSolanaTokenApproval({ onSuccess, onError }: UseSolanaTokenApprovalOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const approve = useCallback(async (_params: SolanaApprovalParams) => {
        setIsPending(true);
        setError(null);

        try {
            // On Solana, SPL token approvals work differently than ERC20:
            // - No unlimited approval pattern
            // - Uses delegate authority via spl-token approve instruction
            // - May not be needed depending on program design (CPI can handle transfers)
            //
            // TODO: Implement if Anchor program requires delegate authority
            throw new Error('Solana token approval not yet implemented — may not be needed');
        } catch (err) {
            const approvalError = err instanceof Error ? err : new Error('Solana approval failed');
            setError(approvalError);
            setIsPending(false);
            onError?.(approvalError);
        }
    }, [onError]);

    return {
        approve,
        isPending,
        isConfirming: false, // No separate confirming state on Solana
        isConfirmed,
        error,
        hash: txHash,
    };
}
