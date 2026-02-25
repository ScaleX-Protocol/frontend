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
    deriveOpenOrdersAccount,
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
    /** Lot size for base (from market config, default 1) */
    baseLotSize?: number;
    /** Lot size for quote (from market config, default 1) */
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
            const baseLotSize = params.baseLotSize || 1;
            const quoteLotSize = params.quoteLotSize || 1;

            // ── 2. Create program client ─────────────────────────
            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            // ── 3. Ensure open orders accounts exist ─────────────
            setCurrentStep(SolanaOrderStep.SETUP_ACCOUNTS);
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
                const [eventAuthority] = deriveEventAuthority();
                await program.methods
                    .createOpenOrdersAccount('default')
                    .accounts({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        delegateAccount: PublicKey.default,
                        openOrdersIndexer: indexer,
                        openOrdersAccount: ooa,
                        market: marketPubkey,
                        systemProgram: SystemProgram.programId,
                        program: OPENBOOK_PROGRAM_ID,
                        eventAuthority,
                    })
                    .rpc();
            }

            // ── 4. Resolve market accounts ───────────────────────
            const marketAccounts = await resolveMarketAccounts(program, marketPubkey);

            // ── 5. Build PlaceOrderArgs ──────────────────────────
            setCurrentStep(SolanaOrderStep.SUBMITTING);

            // Convert human amounts to lot-based amounts
            const baseLots = Math.floor((quantity * 10 ** params.baseDecimals) / baseLotSize);
            const priceLots = params.orderType === PlaceOrderType.Market
                ? (params.side === Side.Bid ? new BN('18446744073709551615') : new BN(1)) // max u64 for market buy, 1 for sell
                : new BN(Math.floor((price * 10 ** params.quoteDecimals * baseLotSize) / (quoteLotSize * 10 ** params.baseDecimals)));

            const maxBaseLots = new BN(baseLots);
            // maxQuoteLotsIncludingFees: for buys, compute from price * quantity + buffer for fees
            const quoteAmount = price * quantity * 10 ** params.quoteDecimals;
            const maxQuoteLotsIncludingFees = new BN(Math.ceil((quoteAmount * 1.05) / quoteLotSize)); // 5% fee buffer

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
            const userTokenAccount = getUserTokenAccount(ownerPubkey, tokenMint);
            const marketVault = params.side === Side.Bid
                ? marketAccounts.marketQuoteVault
                : marketAccounts.marketBaseVault;

            const [eventAuthority] = deriveEventAuthority();

            // ── 6. Send placeOrder instruction ───────────────────
            const signature = await program.methods
                .placeOrder(args)
                .accounts({
                    signer: ownerPubkey,
                    openOrdersAccount: openOrdersInfo.openOrdersAccount,
                    openOrdersAdmin: PublicKey.default,
                    userTokenAccount,
                    market: marketPubkey,
                    bids: marketAccounts.bids,
                    asks: marketAccounts.asks,
                    eventHeap: marketAccounts.eventHeap,
                    marketVault,
                    oracleA: params.oracleA ? new PublicKey(params.oracleA) : PublicKey.default,
                    oracleB: params.oracleB ? new PublicKey(params.oracleB) : PublicKey.default,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    program: OPENBOOK_PROGRAM_ID,
                    eventAuthority,
                })
                .rpc();

            // ── 7. Confirm ───────────────────────────────────────
            setCurrentStep(SolanaOrderStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

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
