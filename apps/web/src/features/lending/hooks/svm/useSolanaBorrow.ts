'use client';

/**
 * Solana Borrow Hook (Stub)
 *
 * TODO: Implement using Anchor + IDL for the Solana Lending program.
 * This stub mirrors the EVM useBorrow interface so components can
 * switch between chains without changing their code.
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    TOKEN_PROGRAM_ID,
    getTokenMint,
    getLendingPoolAddress,
    getOracleAddress,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserCollateral } from '@/lib/anchor/pda';

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
    /** Token symbol, e.g. 'USDC' */
    tokenSymbol: string;
    /** Human-readable amount, e.g. '100.5' */
    amount: string;
    /** Token decimals (default 6) */
    decimals?: number;
    /** Privy wallet object */
    wallet: {
        address: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: (tx: any) => Promise<any>;
    };
}

export function useSolanaBorrow({ onSuccess, onError }: UseSolanaBorrowOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaBorrowStep>(SolanaBorrowStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const borrow = useCallback(async (params: SolanaBorrowParams) => {
        setIsPending(true);
        setCurrentStep(SolanaBorrowStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid borrow amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            const borrowOracle = getOracleAddress(params.tokenSymbol);
            if (!borrowOracle) throw new Error(`No oracle for: ${params.tokenSymbol}`);

            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const borrowAmountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const borrowerPubkey = anchorWallet.publicKey;

            const userTokenAccount = getAssociatedTokenAddressSync(assetMint, borrowerPubkey);
            const [poolVault] = derivePoolVault(lendingPool);
            const [userCollateral] = deriveUserCollateral(lendingPool, borrowerPubkey);

            // ── 3. Send borrow instruction ───────────────────
            setCurrentStep(SolanaBorrowStep.BORROWING);

            const signature = await program.methods
                .borrow(borrowAmountRaw)
                .accounts({
                    borrower: borrowerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userCollateral,
                    borrowOracle,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            // ── 4. Confirm ──────────────────────────────────
            setCurrentStep(SolanaBorrowStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            setTxHash(signature);
            setCurrentStep(SolanaBorrowStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const borrowError = err instanceof Error ? err : new Error('Solana borrow failed');
            setError(borrowError);
            setCurrentStep(SolanaBorrowStep.ERROR);
            setIsPending(false);
            onError?.(borrowError);
        }
    }, [connection, onSuccess, onError]);

    return {
        borrow,
        isPending,
        isConfirming: currentStep === SolanaBorrowStep.CONFIRMING,
        isConfirmed: currentStep === SolanaBorrowStep.COMPLETED,
        currentStep,
        error,
        txHash,
    };
}
