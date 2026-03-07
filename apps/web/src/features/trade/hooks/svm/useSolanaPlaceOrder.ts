'use client';

/**
 * Solana Place Order Hook — Real Anchor Implementation
 *
 * Uses the OpenBook V2 `placeOrder` instruction with PlaceOrderArgs:
 *   - side: Bid (buy) or Ask (sell)
 *   - priceLots: price in lot units
 *   - maxBaseLots: max base quantity in lots
 *   - maxQuoteLotsIncludingFees: max quote with fees
 *   - orderType: Limit, Market, PostOnly, ImmediateOrCancel, etc.
 *   - expiryTimestamp: 0 for no expiry
 *   - selfTradeBehavior: DecrementTake (default)
 *   - limit: max orders to match (default 255)
 *
 * Flow:
 *   1. Validate params
 *   2. Ensure OpenOrders accounts exist (creates if needed)
 *   3. Resolve market accounts
 *   4. Build PlaceOrderArgs
 *   5. Send placeOrder instruction
 *   6. Confirm transaction
 *
 * NOTE: All transactions use manual send-and-confirm (blockheight strategy)
 * instead of Anchor's .rpc() to avoid the 30s legacy timeout on devnet.
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction, Connection } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useSolana } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    resolveMarketAccounts,
    resolveOpenOrders,
    TOKEN_PROGRAM_ID,
    OPENBOOK_PROGRAM_ID,
    sideToAnchor,
    orderTypeToAnchor,
    selfTradeBehaviorToAnchor,
    Side,
    PlaceOrderType,
    SelfTradeBehavior,
} from '@/lib/anchor';
import {
    deriveOpenOrdersIndexer,
    deriveEventAuthority,
} from '@/lib/anchor/pda';

export enum SolanaOrderStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    SETUP_ACCOUNTS = 'setup_accounts',
    SUBMITTING = 'submitting',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

export { Side as SolanaOrderSide };

interface UseSolanaPlaceOrderOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export interface SolanaPlaceOrderParams {
    /** Market address */
    marketAddress: string;
    /** Order side: Bid (buy) or Ask (sell) */
    side: Side;
    /** Price in human-readable format (e.g. "45000.50") — ignored for market orders */
    price: string;
    /** Base quantity in human-readable format (e.g. "0.01") */
    quantity: string;
    /** Order type: Limit, Market, PostOnly, etc. */
    orderType: PlaceOrderType;
    /** Base token decimals */
    baseDecimals: number;
    /** Quote token decimals */
    quoteDecimals: number;
    /** @deprecated — lot sizes are now read directly from the on-chain market account */
    baseLotSize?: number;
    /** @deprecated — lot sizes are now read directly from the on-chain market account */
    quoteLotSize?: number;
    /** Self-trade behavior (default: DecrementTake) */
    selfTradeBehavior?: SelfTradeBehavior;
    /** Client order ID (optional, for tracking) */
    clientOrderId?: number;
    /** Privy wallet */
    wallet: {
        address: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: (tx: any) => Promise<any>;
    };
    /** Optional oracle A address */
    oracleA?: string;
    /** Optional oracle B address */
    oracleB?: string;
}

/**
 * Send a transaction and poll getSignatureStatus until confirmed.
 * Does NOT use confirmTransaction (blockheight-based) to avoid "block height exceeded"
 * errors on slow devnet — the tx may already be confirmed when that error fires.
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
        maxRetries: 0, // we handle retries below
    });

    // Poll until confirmed, timed out, or on-chain error
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

        // Re-broadcast every cycle in case the tx was dropped (common on devnet)
        const currentHeight = await connection.getBlockHeight('confirmed');
        if (currentHeight <= lastValidBlockHeight) {
            await connection.sendRawTransaction(rawTx, {
                skipPreflight: true,
                maxRetries: 0,
            });
        }

        await new Promise(r => setTimeout(r, 2_000));
    }

    // One final check — tx may have landed just as we timed out
    const { value: finalStatus } = await connection.getSignatureStatus(sig, {
        searchTransactionHistory: true,
    });
    if (finalStatus && !finalStatus.err &&
        (finalStatus.confirmationStatus === 'confirmed' || finalStatus.confirmationStatus === 'finalized')) {
        return sig;
    }

    throw new Error(`Transaction not confirmed within ${timeoutMs / 1000}s (sig: ${sig})`);
}

/**
 * Hook to place orders on an OpenBook V2 market via Anchor.
 */
export function useSolanaPlaceOrder({ onSuccess, onError }: UseSolanaPlaceOrderOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaOrderStep>(SolanaOrderStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { connection } = useSolana();

    const placeOrder = useCallback(async (params: SolanaPlaceOrderParams) => {
        setIsPending(true);
        setCurrentStep(SolanaOrderStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────────
            const quantity = parseFloat(params.quantity);
            const price = parseFloat(params.price);
            if (isNaN(quantity) || quantity <= 0) {
                throw new Error('Invalid order quantity');
            }
            if (params.orderType !== PlaceOrderType.Market && (isNaN(price) || price <= 0)) {
                throw new Error('Invalid order price');
            }
            if (!params.wallet?.address) {
                throw new Error('Wallet not connected');
            }

            const marketPubkey = new PublicKey(params.marketAddress);

            // ── 2. Create program client ─────────────────────────
            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            // ── 3. Ensure open orders accounts exist ─────────────
            setCurrentStep(SolanaOrderStep.SETUP_ACCOUNTS);
            const openOrdersInfo = await resolveOpenOrders(connection, ownerPubkey);

            if (!openOrdersInfo.indexerExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                const tx = await program.methods
                    .createOpenOrdersIndexer()
                    .accountsStrict({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        openOrdersIndexer: indexer,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();
                await sendAndConfirm(connection, anchorWallet, tx, ownerPubkey);
            }

            if (!openOrdersInfo.openOrdersExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                const [eventAuthority] = deriveEventAuthority();
                const tx = await program.methods
                    .createOpenOrdersAccount('default')
                    .accountsStrict({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        delegateAccount: null, // optional — no delegate
                        openOrdersIndexer: indexer,
                        openOrdersAccount: openOrdersInfo.openOrdersAccount, // PDA at ["OpenOrders", owner, u32_le(1)]
                        market: marketPubkey,
                        systemProgram: SystemProgram.programId,
                        program: OPENBOOK_PROGRAM_ID,
                        eventAuthority,
                    })
                    .transaction();
                await sendAndConfirm(connection, anchorWallet, tx, ownerPubkey);
            }

            // ── 4. Resolve market accounts ───────────────────────
            const marketAccounts = await resolveMarketAccounts(program, marketPubkey);

            // ── 5. Build PlaceOrderArgs ──────────────────────────
            setCurrentStep(SolanaOrderStep.SUBMITTING);

            // Use on-chain lot sizes (fetched from market account above)
            const baseLotSize = marketAccounts.baseLotSize;
            const quoteLotSize = marketAccounts.quoteLotSize;

            // Convert human amounts to lot-based amounts
            const baseLots = Math.floor((quantity * 10 ** params.baseDecimals) / baseLotSize);
            const priceLotsRaw = params.orderType === PlaceOrderType.Market
                ? (params.side === Side.Bid ? Infinity : 0)
                : (price * 10 ** params.quoteDecimals * baseLotSize) / (quoteLotSize * 10 ** params.baseDecimals);
            const priceLots = params.orderType === PlaceOrderType.Market
                ? (params.side === Side.Bid ? new BN('18446744073709551615') : new BN(1)) // max u64 for market buy, 1 for sell
                : new BN(Math.floor(priceLotsRaw));

            const maxBaseLots = new BN(baseLots);
            // maxQuoteLotsIncludingFees: for buys, compute from price * quantity + buffer for fees
            const quoteAmount = price * quantity * 10 ** params.quoteDecimals;
            const maxQuoteLotsIncludingFees = new BN(Math.ceil((quoteAmount * 1.05) / quoteLotSize)); // 5% fee buffer

            // Validate priceLots — if 0, the price is below the market's minimum tick size
            if (params.orderType !== PlaceOrderType.Market && priceLots.eqn(0)) {
                const minPrice = (quoteLotSize * 10 ** params.baseDecimals) / (baseLotSize * 10 ** params.quoteDecimals);
                throw new Error(`Price too low. Minimum price for this market is ${minPrice} ${params.side === Side.Bid ? 'quote' : 'base'} per token (tick size = ${minPrice}).`);
            }

            console.log('[placeorder-debug] lot calculation', {
                price, quantity,
                baseDecimals: params.baseDecimals,
                quoteDecimals: params.quoteDecimals,
                baseLotSize,
                quoteLotSize,
                baseLots,
                priceLotsRaw,
                priceLots: priceLots.toString(),
                maxBaseLots: maxBaseLots.toString(),
                maxQuoteLotsIncludingFees: maxQuoteLotsIncludingFees.toString(),
                orderType: params.orderType,
                side: params.side,
            });

            const args = {
                side: sideToAnchor(params.side),
                priceLots,
                maxBaseLots,
                maxQuoteLotsIncludingFees,
                clientOrderId: new BN(params.clientOrderId || Date.now()),
                orderType: orderTypeToAnchor(params.orderType),
                expiryTimestamp: new BN(0), // no expiry
                selfTradeBehavior: selfTradeBehaviorToAnchor(
                    params.selfTradeBehavior || SelfTradeBehavior.DecrementTake
                ),
                limit: 255, // max matching iterations
            };

            // Determine which token the user sends (bid → quote, ask → base)
            const tokenMint = params.side === Side.Bid
                ? marketAccounts.quoteMint
                : marketAccounts.baseMint;
            // Use spl-token directly — avoids any risk from our custom getATA helper
            const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, ownerPubkey);
            const marketVault = params.side === Side.Bid
                ? marketAccounts.marketQuoteVault
                : marketAccounts.marketBaseVault;

            // ── 6. Ensure user ATA exists (create if missing) ────
            // Check on-chain; if absent, prepend createATA to the placeOrder tx
            const ataInfo = await connection.getAccountInfo(userTokenAccount);
            const needsAta = ataInfo === null;

            // ── 7. Send placeOrder instruction ───────────────────
            setCurrentStep(SolanaOrderStep.CONFIRMING);

            const orderTx = await program.methods
                .placeOrder(args, false, new BN(0), false, new BN(0))
                .accountsStrict({
                    signer: ownerPubkey,
                    openOrdersAccount: openOrdersInfo.openOrdersAccount,
                    openOrdersAdmin: null, // optional — no admin on devnet markets
                    userTokenAccount,
                    market: marketPubkey,
                    bids: marketAccounts.bids,
                    asks: marketAccounts.asks,
                    eventHeap: marketAccounts.eventHeap,
                    marketVault,
                    oracleA: params.oracleA ? new PublicKey(params.oracleA) : null, // optional
                    oracleB: params.oracleB ? new PublicKey(params.oracleB) : null, // optional
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .transaction();

            // Prepend createATA instruction if the user's token account doesn't exist yet
            if (needsAta) {
                const createAtaIx = createAssociatedTokenAccountInstruction(
                    ownerPubkey,      // payer
                    userTokenAccount, // ata (derived from getAssociatedTokenAddressSync above)
                    ownerPubkey,      // owner
                    tokenMint,        // mint
                );
                orderTx.instructions.unshift(createAtaIx);
            }

            const signature = await sendAndConfirm(connection, anchorWallet, orderTx, ownerPubkey);

            setTxHash(signature);
            setCurrentStep(SolanaOrderStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const orderError = err instanceof Error ? err : new Error('Solana order failed');
            setError(orderError);
            setCurrentStep(SolanaOrderStep.ERROR);
            setIsPending(false);
            onError?.(orderError);
        }
    }, [connection, onSuccess, onError]);

    // Convenience wrappers
    const placeMarketOrder = useCallback(async (params: Omit<SolanaPlaceOrderParams, 'orderType' | 'price'> & { price?: string }) => {
        return placeOrder({
            ...params,
            price: params.price || '0',
            orderType: PlaceOrderType.Market,
        });
    }, [placeOrder]);

    const placeLimitOrder = useCallback(async (params: Omit<SolanaPlaceOrderParams, 'orderType'>) => {
        return placeOrder({
            ...params,
            orderType: PlaceOrderType.Limit,
        });
    }, [placeOrder]);

    return {
        /** Place any order type */
        placeOrder,
        /** Convenience: place a market order */
        placeMarketOrder,
        /** Convenience: place a limit order */
        placeLimitOrder,
        isPending,
        isConfirming: currentStep === SolanaOrderStep.CONFIRMING,
        isAuthenticated: true, // Privy handles auth
        currentStep,
        error,
        txHash,
    };
}
