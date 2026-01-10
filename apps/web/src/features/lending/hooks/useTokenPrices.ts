import { useMemo } from 'react';
import { useMarkets } from '@/features/trade/hooks/chart/useMarkets';

/**
 * Hook to get real-time USD prices for individual tokens
 * Derives prices from trading pair markets (e.g., sxWETHsxUSDC)
 */
export function useTokenPrices() {
  const { data: markets, isLoading } = useMarkets();

  const prices = useMemo(() => {
    if (!markets || markets.length === 0) {
      return {};
    }

    const priceMap: Record<string, number> = {
      // Stablecoins have fixed $1 price
      'USDC': 1,
      'gsUSDC': 1,
      'sxUSDC': 1,
    };

    // Derive token prices from trading pairs
    markets.forEach((market) => {
      const { baseAsset, quoteAsset, latestPrice } = market;
      const price = parseFloat(latestPrice);

      if (isNaN(price) || price <= 0) {
        return;
      }

      // If quote asset is a stablecoin, derive base asset price
      if (quoteAsset === 'sxUSDC' || quoteAsset === 'gsUSDC' || quoteAsset === 'USDC') {
        priceMap[baseAsset] = price;

        // Also set price for synthetic/wrapped versions
        if (baseAsset.startsWith('sx')) {
          const underlyingAsset = baseAsset.replace('sx', '');
          priceMap[underlyingAsset] = price;
        }
        if (baseAsset.startsWith('gs')) {
          const underlyingAsset = baseAsset.replace('gs', '');
          priceMap[underlyingAsset] = price;
        }
      }

      // If base asset is a stablecoin, derive quote asset price
      if (baseAsset === 'sxUSDC' || baseAsset === 'gsUSDC' || baseAsset === 'USDC') {
        if (price !== 0) {
          priceMap[quoteAsset] = 1 / price;

          // Also set price for synthetic/wrapped versions
          if (quoteAsset.startsWith('sx')) {
            const underlyingAsset = quoteAsset.replace('sx', '');
            priceMap[underlyingAsset] = 1 / price;
          }
          if (quoteAsset.startsWith('gs')) {
            const underlyingAsset = quoteAsset.replace('gs', '');
            priceMap[underlyingAsset] = 1 / price;
          }
        }
      }
    });

    return priceMap;
  }, [markets]);

  const getTokenPrice = (symbol: string): number => {
    return prices[symbol] || 0;
  };

  const getUsdValue = (tokenAmount: string | number, symbol: string): string => {
    const amount = typeof tokenAmount === 'string' ? parseFloat(tokenAmount) : tokenAmount;

    if (!amount || amount <= 0 || isNaN(amount)) {
      return '$ 0.00';
    }

    const price = getTokenPrice(symbol);
    const usdValue = amount * price;

    return `$ ${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return {
    prices,
    getTokenPrice,
    getUsdValue,
    isLoading,
  };
}
