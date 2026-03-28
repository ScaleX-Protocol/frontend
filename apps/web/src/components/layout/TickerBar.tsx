import { useTickerAll } from '@/hooks/useTickerAll';
import { useMarkets } from '@/features/trade/hooks/chart/useMarkets';
import { formatPrice } from '@/core/utils';
import { useNavigate, useLocation } from '@tanstack/react-router';
import type { Ticker24hr } from '@/features/trade/types/chart.types';

export default function TickerBar() {
  const { data: tickers, isLoading, isError } = useTickerAll();
  const { data: markets = [] } = useMarkets();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTickerClick = (ticker: Ticker24hr) => {
    // Ticker symbol uses "sxWETH/sxIDRX" format; market symbol uses "sxWETHsxIDRX"
    const normalizedSymbol = ticker.symbol.replace('/', '');
    const market = markets.find(m => m.symbol === normalizedSymbol);
    if (!market) return;

    const isOnTrade = location.pathname.startsWith('/trade');
    navigate({
      to: '/trade/$pairId',
      params: { pairId: market.poolId },
      replace: isOnTrade,
    });
  };

  if (isLoading) return <TickerBarSkeleton />;
  if (isError || !tickers || tickers.length === 0) return null;

  return (
    <div
      className="sticky z-40 w-full overflow-hidden border-b border-[#222222] bg-[#000000] h-8"
      style={{ top: 64 }}
    >
      <div className="flex items-center h-full animate-ticker-scroll whitespace-nowrap">
        {[...tickers, ...tickers].map((ticker, i) => (
          <TickerItem
            key={`${ticker.symbol}-${i}`}
            ticker={ticker}
            onClick={handleTickerClick}
          />
        ))}
      </div>
    </div>
  );
}

function TickerBarSkeleton() {
  return (
    <div className="sticky z-40 w-full h-8 border-b border-[#222222] bg-[#000000]" style={{ top: 64 }}>
      <div className="animate-pulse w-full h-full bg-linear-to-r from-[#111111] via-[#1A1A1A] to-[#111111]" />
    </div>
  );
}

interface TickerItemProps {
  ticker: Ticker24hr;
  onClick: (ticker: Ticker24hr) => void;
}

function TickerItem({ ticker, onClick }: TickerItemProps) {
  const changePercent = parseFloat(ticker.priceChangePercent);
  const isPositive = changePercent >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const changeColor = isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]';
  const formattedChange = `${Math.abs(changePercent).toFixed(2)}%`;

  return (
    <button
      type="button"
      onClick={() => onClick(ticker)}
      className="inline-flex items-center gap-1.5 px-4 text-xs cursor-pointer hover:bg-[#111111] transition-colors h-full shrink-0"
    >
      <span className="text-[#888888] font-medium">{ticker.symbol}</span>
      <span className="text-[#FFFFFF]">{formatPrice(ticker.lastPrice)}</span>
      <span className={changeColor}>
        {arrow} {formattedChange}
      </span>
      <span className="text-[#333333] ml-2">·</span>
    </button>
  );
}
