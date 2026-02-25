'use client';

/**
 * Solana Withdraw Hook — Real Anchor Implementation
 *
 * Withdraws settled tokens from an OpenBook V2 market vault using `settleFunds`.
 * On Solana/OpenBook, "withdraw" maps to settling funds from the market vault
 * back to the user's token accounts.
 *
 * The on-chain instruction is:
 *   settleFunds() — no args, settles all available funds
 *
 * Flow:
 *   1. Validate wallet
 *   2. Resolve market accounts
 *   3. Send settleFunds instruction
 *   4. Confirm transaction
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useSolana } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    resolveMarketAccounts,
    resolveOpenOrders,
    getUserTokenAccount,
    TOKEN_PROGRAM_ID,
} from '@/lib/anchor';

export enum SolanaWithdrawStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    SETTLING = 'settling',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaWithdrawOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export interface SolanaWithdrawParams {
    /** Market address to settle funds from */
    marketAddress: string;
    /** Privy wallet object */
    wallet: {
        address: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: (tx: any) => Promise<any>;
    };
}

/**
 * Hook to withdraw (settle) tokens from an OpenBook V2 market vault via Anchor.
 */
export function useSolanaWithdraw({ onSuccess, onError }: UseSolanaWithdrawOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaWithdrawStep>(SolanaWithdrawStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { connection } = useSolana();

    const withdraw = useCallback(async (params: SolanaWithdrawParams) => {
        setIsPending(true);
        setCurrentStep(SolanaWithdrawStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            if (!params.wallet?.address) {
                throw new Error('Wallet not connected');
            }

            const marketPubkey = new PublicKey(params.marketAddress);

            // ── 1. Create program client ─────────────────────────
            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            // ── 2. Resolve market accounts ───────────────────────
            const marketAccounts = await resolveMarketAccounts(program, marketPubkey);

            // ── 3. Resolve open orders account ───────────────────
            const openOrdersInfo = await resolveOpenOrders(connection, ownerPubkey);
            if (!openOrdersInfo.openOrdersExists) {
                throw new Error('No open orders account found — nothing to settle');
            }

            // ── 4. Build & send settleFunds instruction ──────────
            setCurrentStep(SolanaWithdrawStep.SETTLING);

            const userBaseAccount = getUserTokenAccount(ownerPubkey, marketAccounts.baseMint);
            const userQuoteAccount = getUserTokenAccount(ownerPubkey, marketAccounts.quoteMint);

            const signature = await program.methods
                .settleFunds()
                .accounts({
                    owner: ownerPubkey,
                    penaltyPayer: ownerPubkey,
                    openOrdersAccount: openOrdersInfo.openOrdersAccount,
                    market: marketPubkey,
                    marketAuthority: marketAccounts.marketAuthority,
                    marketBaseVault: marketAccounts.marketBaseVault,
                    marketQuoteVault: marketAccounts.marketQuoteVault,
                    userBaseAccount,
                    userQuoteAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            // ── 5. Confirm ───────────────────────────────────────
            setCurrentStep(SolanaWithdrawStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            setTxHash(signature);
            setCurrentStep(SolanaWithdrawStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const withdrawError = err instanceof Error ? err : new Error('Solana withdraw failed');
            setError(withdrawError);
            setCurrentStep(SolanaWithdrawStep.ERROR);
            setIsPending(false);
            onError?.(withdrawError);
        }
    }, [connection, onSuccess, onError]);

    return {
        withdraw,
        isPending,
        currentStep,
        error,
        txHash,
    };
}
