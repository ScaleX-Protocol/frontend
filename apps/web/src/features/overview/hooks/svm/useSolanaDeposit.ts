'use client';

/**
 * Solana Deposit Hook — Real Anchor Implementation
 *
 * Deposits tokens into an OpenBook V2 market vault using the `deposit` instruction.
 * The on-chain instruction signature is:
 *   deposit(baseAmount: u64, quoteAmount: u64)
 *
 * Flow:
 *   1. Validate params
 *   2. Resolve market accounts (bids, asks, vaults, etc.)
 *   3. Check/create OpenOrdersIndexer + OpenOrdersAccount if needed
 *   4. Build & send the deposit instruction via Anchor
 *   5. Confirm transaction
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useSolana } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    resolveMarketAccounts,
    resolveOpenOrders,
    getUserTokenAccount,
    TOKEN_PROGRAM_ID,
} from '@/lib/anchor';
import { deriveOpenOrdersIndexer, deriveOpenOrdersAccount } from '@/lib/anchor/pda';

export enum SolanaDepositStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    SETUP_ACCOUNTS = 'setup_accounts',
    DEPOSITING = 'depositing',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaDepositOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export interface SolanaDepositParams {
    /** SPL token mint address */
    tokenMint: string;
    /** Amount to deposit (human-readable, e.g. "1.5") */
    amount: string;
    /** Token decimals */
    decimals: number;
    /** Market address to deposit into */
    marketAddress: string;
    /** Whether this token is the base token of the market */
    isBase: boolean;
    /** Privy wallet object with address and signTransaction */
    wallet: {
        address: string;
        signTransaction: (tx: any) => Promise<any>;
    };
}

/**
 * Hook to deposit SPL tokens into an OpenBook V2 market vault via Anchor.
 */
export function useSolanaDeposit({ onSuccess, onError }: UseSolanaDepositOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaDepositStep>(SolanaDepositStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { connection } = useSolana();

    const deposit = useCallback(async (params: SolanaDepositParams) => {
        setIsPending(true);
        setCurrentStep(SolanaDepositStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────────
            const amount = parseFloat(params.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid deposit amount');
            }

            if (!params.wallet?.address) {
                throw new Error('Wallet not connected');
            }

            const rawAmount = new BN(Math.floor(amount * 10 ** params.decimals));
            const marketPubkey = new PublicKey(params.marketAddress);

            // ── 2. Create program client ─────────────────────────
            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            // ── 3. Resolve market accounts ───────────────────────
            setCurrentStep(SolanaDepositStep.SETUP_ACCOUNTS);
            const marketAccounts = await resolveMarketAccounts(program, marketPubkey);

            // ── 4. Check/create open orders accounts ─────────────
            const openOrdersInfo = await resolveOpenOrders(connection, ownerPubkey);

            if (!openOrdersInfo.indexerExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                await program.methods
                    .createOpenOrdersIndexer()
                    .accounts({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        openOrdersIndexer: indexer,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
            }

            if (!openOrdersInfo.openOrdersExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                const [ooa] = deriveOpenOrdersAccount(ownerPubkey, 0);
                await program.methods
                    .createOpenOrdersAccount('default')
                    .accounts({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        openOrdersIndexer: indexer,
                        openOrdersAccount: ooa,
                        market: marketPubkey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
            }

            // ── 5. Build & send deposit instruction ──────────────
            setCurrentStep(SolanaDepositStep.DEPOSITING);

            const baseAmount = params.isBase ? rawAmount : new BN(0);
            const quoteAmount = params.isBase ? new BN(0) : rawAmount;

            const userBaseAccount = getUserTokenAccount(ownerPubkey, marketAccounts.baseMint);
            const userQuoteAccount = getUserTokenAccount(ownerPubkey, marketAccounts.quoteMint);

            const signature = await program.methods
                .deposit(baseAmount, quoteAmount)
                .accounts({
                    owner: ownerPubkey,
                    userBaseAccount,
                    userQuoteAccount,
                    openOrdersAccount: openOrdersInfo.openOrdersAccount,
                    market: marketPubkey,
                    marketBaseVault: marketAccounts.marketBaseVault,
                    marketQuoteVault: marketAccounts.marketQuoteVault,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            // ── 6. Confirm ───────────────────────────────────────
            setCurrentStep(SolanaDepositStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            setTxHash(signature);
            setCurrentStep(SolanaDepositStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const depositError = err instanceof Error ? err : new Error('Solana deposit failed');
            setError(depositError);
            setCurrentStep(SolanaDepositStep.ERROR);
            setIsPending(false);
            onError?.(depositError);
        }
    }, [connection, onSuccess, onError]);

    return {
        deposit,
        isPending,
        currentStep,
        error,
        txHash,
    };
}
