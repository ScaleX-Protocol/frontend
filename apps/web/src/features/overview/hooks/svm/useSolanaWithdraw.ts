'use client';

/**
 * Solana Withdraw Hook — withdrawCollateral via Anchor IDL
 *
 * Uses the on-chain `withdrawCollateral(requestedAmount)` instruction.
 *
 * Accounts required by IDL:
 *   owner            — signer
 *   userTokenAccount  — user's ATA for the asset
 *   assetMint         — SPL token mint
 *   lendingPool       — lending pool address (from constants)
 *   poolVault         — PDA: ["PoolVault", lendingPool]
 *   userCollateral    — PDA: ["UserCollateral", lendingPool, owner]
 *   oracle            — price oracle for the asset
 *   tokenProgram      — SPL Token program
 *
 * Flow:
 *   1. Validate params (amount, wallet, token symbol)
 *   2. Resolve lending pool, pool vault PDA, user collateral PDA, oracle
 *   3. Send withdrawCollateral(requestedAmount) instruction
 *   4. Confirm transaction
 */

import { useState, useCallback } from 'react';
import { Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    TOKEN_PROGRAM_ID,
    getTokenMint,
    getLendingPoolAddress,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserBalance } from '@/lib/anchor/pda';

export enum SolanaWithdrawStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    SUBMITTING = 'submitting',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaWithdrawOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export interface SolanaWithdrawParams {
    /** Token symbol, e.g. 'BTC', 'USDT', 'WETH' */
    tokenSymbol: string;
    /** Human-readable amount, e.g. '1.5' */
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
 * Poll getSignatureStatuses until the transaction is confirmed or the blockhash expires.
 * Avoids WebSocket subscription hangs that occur with connection.confirmTransaction().
 */
async function pollForConfirmation(
    connection: import('@solana/web3.js').Connection,
    signature: string,
    lastValidBlockHeight: number,
    intervalMs = 2000,
    timeoutMs = 90_000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const currentSlot = await connection.getBlockHeight('confirmed').catch(() => 0);
        if (currentSlot > lastValidBlockHeight) {
            throw new Error('Transaction expired (blockhash no longer valid). Please try again.');
        }

        const { value } = await connection.getSignatureStatuses([signature]);
        const status = value[0];

        if (status) {
            if (status.err) {
                throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
            }
            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                return; // success
            }
        }

        await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Transaction confirmation timed out. Check your wallet for the transaction status.');
}

export function useSolanaWithdraw({ onSuccess, onError }: UseSolanaWithdrawOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [currentStep, setCurrentStep] = useState<SolanaWithdrawStep>(SolanaWithdrawStep.IDLE);
    const [error, setError] = useState<Error | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const withdraw = useCallback(async (params: SolanaWithdrawParams) => {
        setIsPending(true);
        setCurrentStep(SolanaWithdrawStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid withdraw amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);



            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const requestedAmount = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            const userTokenAccount = getAssociatedTokenAddressSync(assetMint, ownerPubkey);
            const [poolVault] = derivePoolVault(assetMint);
            const [userBalance] = deriveUserBalance(ownerPubkey);

            // ── 3. Build + sign + send withdraw ────────────
            setCurrentStep(SolanaWithdrawStep.SUBMITTING);

            const tx: Transaction = await program.methods
                .withdraw(requestedAmount)
                .accountsStrict({
                    owner: ownerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userBalance,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .transaction();

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = ownerPubkey;

            const signed = await anchorWallet.signTransaction(tx);
            const signature = await connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });

            // ── 4. Confirm ──────────────────────────────────
            setCurrentStep(SolanaWithdrawStep.CONFIRMING);
            await pollForConfirmation(connection, signature, lastValidBlockHeight);

            setTxHash(signature);
            setCurrentStep(SolanaWithdrawStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const withdrawError = err instanceof Error ? err : new Error('Withdraw failed');
            setError(withdrawError);
            setCurrentStep(SolanaWithdrawStep.ERROR);
            setIsPending(false);
            onError?.(withdrawError);
        }
    }, [connection, onSuccess, onError]);

    return {
        withdraw,
        isPending,
        isConfirming: currentStep === SolanaWithdrawStep.CONFIRMING,
        isConfirmed: currentStep === SolanaWithdrawStep.COMPLETED,
        error,
        txHash,
        currentStep,
    };
}
