import { useMemo } from 'react';
import { useTicker24hr } from '@scalex/service-trading';
import type { Market } from '@scalex/types';
import { TokenIcon } from '@/components/common/TokenIcon';

interface MarketSelectorRowProps {
  market: Market;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (market: Market) => void;
  onToggleFavorite: (poolId: string) => void;
}

export function MarketSelectorRow({
  market,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: MarketSelectorRowProps) {
  const symbol = `${market.baseAsset}/${market.quoteAsset}`;
  const { data: ticker } = useTicker24hr(symbol, { enabled: true });

  const baseDecimals = market.baseDecimals ?? 18;
  const quoteDecimals = market.quoteDecimals ?? 18;

  // Calculate display values
  const displayData = useMemo(() => {
    const lastPrice = ticker
      ? (parseFloat(ticker.lastPrice) / Math.pow(10, quoteDecimals)).toFixed(
          parseFloat(ticker.lastPrice) / Math.pow(10, quoteDecimals) < 1 ? 6 : 2
        )
      : (parseFloat(market.latestPrice) / Math.pow(10, quoteDecimals)).toFixed(2);

    const priceChange = ticker
      ? parseFloat(ticker.priceChange) / Math.pow(10, quoteDecimals)
      : 0;

    const priceChangePercent = ticker
      ? parseFloat(ticker.priceChangePercent)
      : 0;

    // Always use market.volumeInQuote from /markets API as it has reliable data
    const volume = parseFloat(market.volumeInQuote || '0') / Math.pow(10, quoteDecimals);

    // Format volume with K, M, B suffixes
    const formatVolume = (val: number): string => {
      if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
      return `$${val.toFixed(2)}`;
    };

    return {
      lastPrice,
      priceChange: priceChange.toFixed(priceChange < 1 ? 6 : 2),
      priceChangePercent: priceChangePercent.toFixed(2),
      isPositive: priceChangePercent >= 0,
      volume: formatVolume(volume),
    };
  }, [ticker, market, quoteDecimals]);

  const handleRowClick = () => {
    onSelect(market);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(market.poolId);
  };

  return (
    <tr 
      className={`border-l-2 cursor-pointer transition-colors hover:bg-[#2A2A2A] ${
        isSelected ? 'border-l-[#F06718] bg-[#2A2A2A]' : 'border-l-transparent'
      }`}
      onClick={handleRowClick}
    >
      {/* Favorite + Symbol */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="text-[#A0A0A0] hover:text-[#F06718] transition-colors"
          >
            {isFavorite ? (
              <svg className="w-4 h-4 text-[#F06718] fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          <TokenIcon symbol={market.baseAsset} size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-[#E0E0E0] font-medium">{market.baseAsset}/{market.quoteAsset}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#3A3A3A] text-[#A0A0A0] rounded">
              SPOT
            </span>
          </div>
        </div>
      </td>

      {/* Last Price */}
      <td className="py-3 px-4 text-[#E0E0E0] font-mono">
        {displayData.lastPrice}
      </td>

      {/* 24H Change */}
      <td className={`py-3 px-4 font-mono ${displayData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {displayData.isPositive ? '+' : ''}{displayData.priceChange} / {displayData.isPositive ? '+' : ''}{displayData.priceChangePercent}%
      </td>

      {/* Volume */}
      <td className="py-3 px-4 text-[#E0E0E0] text-right font-mono">
        {displayData.volume}
      </td>
    </tr>
  );
}
