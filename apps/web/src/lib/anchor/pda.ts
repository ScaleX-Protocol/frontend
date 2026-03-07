/**
 * PDA Derivation Helpers — OpenBook V2 Program
 *
 * These functions derive Program Derived Addresses (PDAs) used by the
 * openbook_v2 program. PDAs are deterministic addresses based on seeds,
 * so the frontend can compute them without on-chain reads.
 *
 * Standard OpenBook V2 PDA seeds:
 * - Market Authority:     ["Market", market_pubkey]
 * - Open Orders Indexer:  ["OpenOrdersIndexer", owner_pubkey]
 * - Open Orders Account:  ["OpenOrdersAccount", owner_pubkey, account_num (LE u32)]
 * - Event Authority:      ["__event_authority"]
 *
 * ScaleX Lending extensions:
 * - User Collateral:      ["UserCollateral", lending_pool_pubkey, owner_pubkey]
 * - Pool Vault:           ["PoolVault", lending_pool_pubkey]
 */

import { PublicKey } from '@solana/web3.js';
import { OPENBOOK_PROGRAM_ID } from './constants';

/** Helper to encode a string as Uint8Array (browser-safe alternative to Buffer.from) */
const encode = (str: string): Uint8Array => new TextEncoder().encode(str);

// ─── Trading PDAs ─────────────────────────────────────────────────────

/**
 * Derive the Market Authority PDA.
 * The market authority controls the market's token vaults.
 */
export function deriveMarketAuthority(marketPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [encode('Market'), marketPubkey.toBuffer()],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive the Open Orders Indexer PDA for a user.
 * One per user — indexes all their OpenOrdersAccounts.
 */
export function deriveOpenOrdersIndexer(ownerPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [encode('OpenOrdersIndexer'), ownerPubkey.toBuffer()],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive an Open Orders Account PDA for a user.
 * One per user per market. accountNum is a u32 index (typically 0 for the first).
 */
export function deriveOpenOrdersAccount(
    ownerPubkey: PublicKey,
    accountNum: number
): [PublicKey, number] {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setUint32(0, accountNum, true); // little-endian
    return PublicKey.findProgramAddressSync(
        [
            encode('OpenOrders'), // program uses "OpenOrders", NOT "OpenOrdersAccount"
            ownerPubkey.toBuffer(),
            new Uint8Array(buf),
        ],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive the Event Authority PDA.
 * Used for Anchor event CPI (standard pattern).
 */
export function deriveEventAuthority(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [encode('__event_authority')],
        OPENBOOK_PROGRAM_ID
    );
}

// ─── Lending PDAs ─────────────────────────────────────────────────────

/**
 * Derive the User Collateral PDA.
 * Seeds: ["UserCollateral", owner] — one per user across all pools.
 */
export function deriveUserCollateral(
    ownerPubkey: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            encode('UserCollateral'),
            ownerPubkey.toBuffer(),
        ],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive the UserBalance PDA.
 * Seeds: ["UserBalance", owner] — unified balance account for deposit/withdraw.
 */
export function deriveUserBalance(
    ownerPubkey: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            encode('UserBalance'),
            ownerPubkey.toBuffer(),
        ],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive the Pool Vault PDA for a lending pool.
 * Seeds: ["PoolVault", asset_mint] — uses the token mint, not the pool address.
 */
export function derivePoolVault(assetMintPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [encode('PoolVault'), assetMintPubkey.toBuffer()],
        OPENBOOK_PROGRAM_ID
    );
}

/**
 * Derive the Stub Oracle PDA.
 * Seeds: ["StubOracle", owner, mint] — used for devnet price feeds.
 */
export function deriveStubOracle(
    ownerPubkey: PublicKey,
    mintPubkey: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [encode('StubOracle'), ownerPubkey.toBuffer(), mintPubkey.toBuffer()],
        OPENBOOK_PROGRAM_ID
    );
}
