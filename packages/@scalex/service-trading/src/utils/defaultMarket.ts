import { TradingConfig } from '../configs/trading';
import type { Market } from '@scalex/types';

export function findDefaultMarket(markets: Market[]): Market | null {
  if (!markets || markets.length === 0) {
    return null;
  }

  // First, try to find the configured default market
  const defaultSymbol = TradingConfig.defaultMarketSymbol;
  const defaultMarket = markets.find(market => 
    `${market.baseAsset}/${market.quoteAsset}` === defaultSymbol
  );

  if (defaultMarket) {
    return defaultMarket;
  }

  // If default market not found, use fallback strategy
  switch (TradingConfig.fallbackStrategy) {
    case 'highest_volume':
      return markets.reduce((highest, current) => {
        const currentVolume = parseFloat(current.volume) || 0;
        const highestVolume = parseFloat(highest.volume) || 0;
        return currentVolume > highestVolume ? current : highest;
      });

    case 'highest_liquidity':
      return markets.reduce((highest, current) => {
        const currentLiquidity = parseFloat(current.totalLiquidityInQuote) || 0;
        const highestLiquidity = parseFloat(highest.totalLiquidityInQuote) || 0;
        return currentLiquidity > highestLiquidity ? current : highest;
      });

    case 'first':
    default:
      return markets[0];
  }
}