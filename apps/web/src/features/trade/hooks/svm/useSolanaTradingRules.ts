'use client';

/**
 * Solana Trading Rules Hook (Stub)
 *
 * TODO: Implement by reading on-chain trading rules from the Solana
 * OrderBook program via Anchor. Mirrors the EVM useTradingRules interface.
 */

interface SolanaTradingRules {
    minTradeAmount: bigint;
    minAmountMovement: bigint;
    minPriceMovement: bigint;
    minOrderSize: bigint;
}

interface UseSolanaTradingRulesParams {
    baseMint: string;     // Base token mint address
    quoteMint: string;    // Quote token mint address
}

export function useSolanaTradingRules({ baseMint, quoteMint }: UseSolanaTradingRulesParams) {
    // TODO: Implement by reading on-chain state via Anchor
    // 1. Derive market PDA from base + quote mints
    // 2. Fetch market account data
    // 3. Extract trading rules

    return {
        tradingRules: undefined as SolanaTradingRules | undefined,
        orderBookAddress: undefined as string | undefined,
        poolKey: undefined,
        isLoading: false,
        error: null,
    };
}
