/**
 * Account Resolution Helpers — Fetch on-chain accounts and derive related addresses
 *
 * These functions read on-chain state to resolve the full set of accounts
 * needed for Anchor instructions. Each instruction requires specific accounts
 * (bids, asks, eventHeap, vaults, etc.) that are stored in the Market or
 * LendingPool on-chain data.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from './constants';
import {
    deriveMarketAuthority,
    deriveOpenOrdersIndexer,
    deriveOpenOrdersAccount,
    deriveEventAuthority,
    deriveUserCollateral,
    derivePoolVault,
} from './pda';

// ─── Market Account Resolution ────────────────────────────────────────

export interface MarketAccounts {
    /** Market pubkey */
    market: PublicKey;
    /** Market authority PDA (controls vaults) */
    marketAuthority: PublicKey;
    /** Bids book side */
    bids: PublicKey;
    /** Asks book side */
    asks: PublicKey;
    /** Event heap for fills */
    eventHeap: PublicKey;
    /** Base token vault */
    marketBaseVault: PublicKey;
    /** Quote token vault */
    marketQuoteVault: PublicKey;
    /** Base token mint */
    baseMint: PublicKey;
    /** Quote token mint */
    quoteMint: PublicKey;
    /** Event authority PDA */
    eventAuthority: PublicKey;
}

/**
 * Fetch a Market account and resolve all associated addresses.
 * This is needed before placing orders, depositing, or settling.
 */
 
export async function resolveMarketAccounts(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    program: Program<any>,
    marketPubkey: PublicKey
): Promise<MarketAccounts> {
    // Fetch market account data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marketAccount: any = await (program.account as any)['market'].fetch(marketPubkey);

    const [marketAuthority] = deriveMarketAuthority(marketPubkey);
    const [eventAuthority] = deriveEventAuthority();

    return {
        market: marketPubkey,
        marketAuthority,
        bids: marketAccount.bids,
        asks: marketAccount.asks,
        eventHeap: marketAccount.eventHeap,
        marketBaseVault: marketAccount.marketBaseVault,
        marketQuoteVault: marketAccount.marketQuoteVault,
        baseMint: marketAccount.baseMint,
        quoteMint: marketAccount.quoteMint,
        eventAuthority,
    };
}

// ─── Open Orders Resolution ──────────────────────────────────────────

export interface OpenOrdersInfo {
    /** Open orders indexer PDA */
    indexer: PublicKey;
    /** Whether the indexer account exists on-chain */
    indexerExists: boolean;
    /** Open orders account PDA (for account #0) */
    openOrdersAccount: PublicKey;
    /** Whether the open orders account exists on-chain */
    openOrdersExists: boolean;
}

/**
 * Check if a user has an OpenOrdersIndexer and OpenOrdersAccount.
 * Returns PDAs + existence flags so callers can create them if needed.
 */
export async function resolveOpenOrders(
    connection: Connection,
    ownerPubkey: PublicKey,
    _accountNum: number = 0
): Promise<OpenOrdersInfo> {
    const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
    const [openOrdersAccount] = deriveOpenOrdersAccount(ownerPubkey, _accountNum);

    // Check if accounts exist on-chain
    const [indexerInfo, oaInfo] = await Promise.all([
        connection.getAccountInfo(indexer),
        connection.getAccountInfo(openOrdersAccount),
    ]);

    return {
        indexer,
        indexerExists: indexerInfo !== null,
        openOrdersAccount,
        openOrdersExists: oaInfo !== null,
    };
}

// ─── User Token Account (ATA) ─────────────────────────────────────────

/**
 * Get the Associated Token Address for a user + mint.
 * This is synchronous — ATAs are deterministic.
 */
export function getUserTokenAccount(
    ownerPubkey: PublicKey,
    mintPubkey: PublicKey
): PublicKey {
    return getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
}

// ─── Lending Account Resolution ───────────────────────────────────────

export interface LendingAccounts {
    /** Lending pool pubkey */
    lendingPool: PublicKey;
    /** Pool vault PDA (holds deposited tokens) */
    poolVault: PublicKey;
    /** User's collateral PDA */
    userCollateral: PublicKey;
    /** User's token ATA (for the asset) */
    userTokenAccount: PublicKey;
    /** Asset mint */
    assetMint: PublicKey;
    /** Oracle for the asset */
    oracle: PublicKey;
}

/**
 * Resolve all accounts needed for lending instructions
 * (depositCollateral, withdrawCollateral, borrow, repay).
 */
export function resolveLendingAccounts(
    ownerPubkey: PublicKey,
    lendingPoolPubkey: PublicKey,
    assetMint: PublicKey,
    oraclePubkey: PublicKey
): LendingAccounts {
    const [poolVault] = derivePoolVault(lendingPoolPubkey);
    const [userCollateral] = deriveUserCollateral(lendingPoolPubkey, ownerPubkey);
    const userTokenAccount = getUserTokenAccount(ownerPubkey, assetMint);

    return {
        lendingPool: lendingPoolPubkey,
        poolVault,
        userCollateral,
        userTokenAccount,
        assetMint,
        oracle: oraclePubkey,
    };
}

// ─── Place Order Account Resolution ──────────────────────────────────

export interface PlaceOrderAccounts {
    signer: PublicKey;
    openOrdersAccount: PublicKey;
    userTokenAccount: PublicKey;
    market: PublicKey;
    bids: PublicKey;
    asks: PublicKey;
    eventHeap: PublicKey;
    marketVault: PublicKey;
    tokenProgram: PublicKey;
    oracleA: PublicKey | null;
    oracleB: PublicKey | null;
}

/**
 * Resolve all accounts needed for a placeOrder instruction.
 *
 * @param signerPubkey - The user's wallet (signer)
 * @param marketAccounts - Resolved market accounts (from resolveMarketAccounts)
 * @param openOrdersAccount - The user's open orders account PDA
 * @param side - Bid (buy quote→base) or Ask (sell base→quote)
 * @param oracleA - Optional oracle A
 * @param oracleB - Optional oracle B
 */
export function resolvePlaceOrderAccounts(
    signerPubkey: PublicKey,
    marketAccounts: MarketAccounts,
    openOrdersAccount: PublicKey,
    side: 'bid' | 'ask',
    oracleA?: PublicKey,
    oracleB?: PublicKey
): PlaceOrderAccounts {
    // For a bid (buy), the user sends quote tokens; for an ask (sell), base tokens
    const tokenMint = side === 'bid' ? marketAccounts.quoteMint : marketAccounts.baseMint;
    const userTokenAccount = getUserTokenAccount(signerPubkey, tokenMint);
    const marketVault = side === 'bid' ? marketAccounts.marketQuoteVault : marketAccounts.marketBaseVault;

    return {
        signer: signerPubkey,
        openOrdersAccount,
        userTokenAccount,
        market: marketAccounts.market,
        bids: marketAccounts.bids,
        asks: marketAccounts.asks,
        eventHeap: marketAccounts.eventHeap,
        marketVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        oracleA: oracleA || null,
        oracleB: oracleB || null,
    };
}
