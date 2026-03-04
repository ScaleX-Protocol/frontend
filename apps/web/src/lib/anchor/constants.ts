/**
 * Anchor Constants — Program IDs and Devnet Addresses
 *
 * All addresses are read from environment variables with fallback
 * to the devnet.json deployment addresses.
 */

import { PublicKey } from '@solana/web3.js';

// ─── Program ID ───────────────────────────────────────────────────────

export const OPENBOOK_PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_SCALEX_PROGRAM_ID || 'GesS1wVm85uRvvjYDAgCVK9MJU5icjsX3LX6GMfibKW1'
);

// ─── Token Mints ──────────────────────────────────────────────────────

export const TOKEN_MINTS = {
    BTC: new PublicKey(
        import.meta.env.VITE_TOKEN_BTC_MINT || 'VJdwDEtpbQcP1xoJVtwUQ3EVhoxhid7LcEMfRtqmcGu'
    ),
    USDT: new PublicKey(
        import.meta.env.VITE_TOKEN_USDT_MINT || 'Fx4eqJMFpVtKt7Z27DqaU1QRTX4hKvsustzDyRZDNo7M'
    ),
    WETH: new PublicKey(
        import.meta.env.VITE_TOKEN_WETH_MINT || '4WxBZ9A5ZPqjvbAWMuHUzDGge1SuamWZM23dwB9c3S8n'
    ),
} as const;

// ─── Market Addresses ─────────────────────────────────────────────────

export const MARKET_ADDRESSES = {
    BTC_USDT: new PublicKey(
        import.meta.env.VITE_MARKET_BTC_USDT || 'A2Acd4esd1h6x3AH6GBTHQKgd3789NHorJdQzRMDHRkK'
    ),
    WETH_USDT: new PublicKey(
        import.meta.env.VITE_MARKET_WETH_USDT || 'FvV13csBHriHVNmJ7YzF1GXugRiniFPCGFmVquf7jkkD'
    ),
} as const;

// ─── Oracle Addresses ─────────────────────────────────────────────────

export const ORACLE_ADDRESSES = {
    BTC: new PublicKey(
        import.meta.env.VITE_ORACLE_BTC || '6wFi3nDMRNeKraGkqosgAgLZ8r181VWng8KBWYmEJcMg'
    ),
    USDT: new PublicKey(
        import.meta.env.VITE_ORACLE_USDT || 'DDmWhTuPu5eVcaftFp4vDt5VPQNq6XTQhbxQcJ88yH2E'
    ),
    WETH: new PublicKey(
        import.meta.env.VITE_ORACLE_WETH || '9Cw1kxstkoNCWrwkcP8uiRfDo5qh8hCsxxNYMjNFHwLd'
    ),
} as const;

// ─── Lending Pool Addresses ───────────────────────────────────────────

export const LENDING_POOL_ADDRESSES = {
    BTC: new PublicKey(
        import.meta.env.VITE_LENDING_POOL_BTC || '2ADwsjPQbYAYiYQnk39TLTk8EzW8nktmFMjuzVqRN9bU'
    ),
    USDT: new PublicKey(
        import.meta.env.VITE_LENDING_POOL_USDT || '7zZDmcjG63CrjSiQtbpkNwS3ZGS7cZWBR68ZpQg5Ry2X'
    ),
    WETH: new PublicKey(
        import.meta.env.VITE_LENDING_POOL_WETH || '9kDf27pPGZLs61WdVYV78spXmqqBbtBV93adKTEBuUin'
    ),
} as const;

// ─── System Programs ──────────────────────────────────────────────────

export const TOKEN_PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_TOKEN_PROGRAM_ID || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_ASSOCIATED_TOKEN_PROGRAM_ID || 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bFS'
);

// ─── Lookup Helpers ───────────────────────────────────────────────────

/** Map token symbol to mint address */
export function getTokenMint(symbol: string): PublicKey | undefined {
    return TOKEN_MINTS[symbol.toUpperCase() as keyof typeof TOKEN_MINTS];
}

/** Map market pair string (e.g. "BTC_USDT") to market address */
export function getMarketAddress(pair: string): PublicKey | undefined {
    return MARKET_ADDRESSES[pair.toUpperCase() as keyof typeof MARKET_ADDRESSES];
}

/** Map token symbol to oracle address */
export function getOracleAddress(symbol: string): PublicKey | undefined {
    return ORACLE_ADDRESSES[symbol.toUpperCase() as keyof typeof ORACLE_ADDRESSES];
}

/** Map token symbol to lending pool address */
export function getLendingPoolAddress(symbol: string): PublicKey | undefined {
    return LENDING_POOL_ADDRESSES[symbol.toUpperCase() as keyof typeof LENDING_POOL_ADDRESSES];
}
