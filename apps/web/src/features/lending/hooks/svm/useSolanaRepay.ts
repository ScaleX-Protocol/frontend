'use client';

/**
 * Solana Repay Hook
 *
 * Repays borrowed tokens to a lending pool via Anchor IDL.
 * Uses the same sendAndConfirm polling pattern as useSolanaBorrow
 * for devnet reliability.
 *
 * userBalance PDA seeds: ["UserBalance", owner] — same account used by borrow.
 */

import { useState, useCallback } from 'react';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    getTokenMint,
    getLendingPoolAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserBalance } from '@/lib/anchor/pda';

/** Derives the Associated Token Account address for (mint, owner) without @solana/spl-token */
function getATA(mint: PublicKey, owner: PublicKey): PublicKey {
    const [ata] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    return ata;
}

export enum SolanaRepayStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    REPAYING = 'repaying',
    CONFIRMING = 'confirming',
    SYNCING = 'syncing',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaRepayOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaRepayParams {
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

/**
 * Send a transaction and poll getSignatureStatus until confirmed.
 * Avoids Anchor's .rpc() 30s devnet timeout.
 */
async function sendAndConfirm(
    connection: Connection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    anchorWallet: any,
    tx: Transaction,
    ownerPubkey: PublicKey,
    timeoutMs = 120_000,
): Promise<string> {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = ownerPubkey;

    const signed = await anchorWallet.signTransaction(tx);
    const rawTx = signed.serialize();

    const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 0,
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const { value: status } = await connection.getSignatureStatus(sig, {
            searchTransactionHistory: true,
        });

        if (status) {
            if (status.err) {
                throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
            }
            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                return sig;
            }
        }

        const currentHeight = await connection.getBlockHeight('confirmed');
        if (currentHeight <= lastValidBlockHeight) {
            await connection.sendRawTransaction(rawTx, { skipPreflight: true, maxRetries: 0 });
        }

        await new Promise(r => setTimeout(r, 2_000));
    }

    const { value: finalStatus } = await connection.getSignatureStatus(sig, {
        searchTransactionHistory: true,
    });
    if (finalStatus && !finalStatus.err &&
        (finalStatus.confirmationStatus === 'confirmed' || finalStatus.confirmationStatus === 'finalized')) {
        return sig;
    }

    throw new Error(`Transaction not confirmed within ${timeoutMs / 1000}s (sig: ${sig})`);
}

export function useSolanaRepay({ onSuccess, onError }: UseSolanaRepayOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaRepayStep>(SolanaRepayStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const repay = useCallback(async (params: SolanaRepayParams) => {
        setIsPending(true);
        setCurrentStep(SolanaRepayStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid repay amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const repayAmountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const repayerPubkey = anchorWallet.publicKey;

            // User repays their own debt
            const borrowerPubkey = repayerPubkey;

            const userTokenAccount = getATA(assetMint, repayerPubkey);
            const [poolVault] = derivePoolVault(assetMint);
            const [userBalance] = deriveUserBalance(borrowerPubkey);

            // ── 3. Build repay tx ────────────────────────────
            setCurrentStep(SolanaRepayStep.REPAYING);

            const tx: Transaction = await program.methods
                .repay(repayAmountRaw)
                .accountsStrict({
                    repayer: repayerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userBalance,
                    borrower: borrowerPubkey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .transaction();

            // ── 4. Send + confirm ────────────────────────────
            setCurrentStep(SolanaRepayStep.CONFIRMING);
            const signature = await sendAndConfirm(connection, anchorWallet, tx, repayerPubkey);

            setTxHash(signature);

            // ── 5. Wait for indexer sync ─────────────────────
            setCurrentStep(SolanaRepayStep.SYNCING);
            await new Promise(resolve => setTimeout(resolve, 4000));

            setCurrentStep(SolanaRepayStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const repayError = err instanceof Error ? err : new Error('Solana repay failed');
            setError(repayError);
            setCurrentStep(SolanaRepayStep.ERROR);
            setIsPending(false);
            onError?.(repayError);
        }
    }, [connection, onSuccess, onError]);

    return {
        repay,
        isPending,
        isConfirming: currentStep === SolanaRepayStep.CONFIRMING,
        isConfirmed: currentStep === SolanaRepayStep.COMPLETED,
        currentStep,
        error,
        txHash,
    };
}
