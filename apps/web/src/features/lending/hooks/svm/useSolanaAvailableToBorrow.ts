'use client';

/**
 * Solana Available-to-Borrow Hook
 *
 * The Solana indexer's /lending/dashboard/:user returns availableToBorrow: [].
 * This hook builds that list from /api/markets using the static devnet token config.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { Market } from '@/features/trade/types/chart.types';
import type { AvailableToBorrow } from '../../types/lending.types';
import { TOKEN_MINTS } from '@/lib/anchor/constants';
import { ChainTypeConfig } from '@/configs/chainType';

/** Static lending config per token (devnet deployment values) */
const LENDING_CONFIG: Record<string, { collateralFactor: string; liquidationThreshold: string }> = {
    BTC:  { collateralFactor: '75', liquidationThreshold: '80' },
    USDT: { collateralFactor: '80', liquidationThreshold: '85' },
    WETH: { collateralFactor: '75', liquidationThreshold: '80' },
};

function marketToAvailableToBorrow(market: Market): AvailableToBorrow | null {
    const assetUpper = market.baseAsset.toUpperCase();
    const config = LENDING_CONFIG[assetUpper];
    if (!config) return null;

    const mintKey = TOKEN_MINTS[assetUpper as keyof typeof TOKEN_MINTS];
    const assetAddress = mintKey ? mintKey.toBase58() : '';

    const askLiq = parseFloat(market.askLiquidity);
    const availableLiquidity = !isNaN(askLiq) ? market.askLiquidity : '0';

    return {
        asset: market.baseAsset,
        assetAddress,
        availableAmount: availableLiquidity,
        availableLiquidity,
        currentBorrowed: '0',
        apy: '0.00%',
        utilizationRate: '0.0%',
        projectedInterest: null,
        collateralFactor: config.collateralFactor,
        liquidationThreshold: config.liquidationThreshold,
        canBorrow: true,
        recommended: false,
        realTimeRates: null,
    };
}

export function useSolanaAvailableToBorrow() {
    return useQuery<AvailableToBorrow[], Error>({
        queryKey: ['solanaAvailableToBorrow'] as const,
        queryFn: async () => {
            const markets = await fetchIndexerAPI<Market[]>('/markets');
            return markets
                .map(marketToAvailableToBorrow)
                .filter((m): m is AvailableToBorrow => m !== null);
        },
        enabled: ChainTypeConfig.isSolana,
        staleTime: 60_000,
    });
}
