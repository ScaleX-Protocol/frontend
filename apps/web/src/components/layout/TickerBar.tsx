import { useState, useEffect, useRef } from 'react';
import { useTickerAll } from '@/hooks/useTickerAll';
import { formatPrice } from '@/core/utils';
import type { Ticker24hr } from '@/features/trade/types/chart.types';

export default function TickerBar() {
  const { data: tickers, isLoading, isError } = useTickerAll();
  const [popup, setPopup] = useState<Ticker24hr | null>(null);

  if (isLoading) return <TickerBarSkeleton />;
  if (isError || !tickers || tickers.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden border-b border-[#1F1F1F] bg-[#050505] h-8">
      <div className={`flex items-center h-full animate-ticker-scroll whitespace-nowrap${popup ? ' paused' : ''}`}>
        {[...tickers, ...tickers].map((ticker, i) => (
          <TickerItem
            key={`${ticker.symbol}-${i}`}
            ticker={ticker}
            onClick={setPopup}
          />
        ))}
      </div>

      {popup && (
        <TickerPopup ticker={popup} onClose={() => setPopup(null)} />
      )}
    </div>
  );
}

function TickerBarSkeleton() {
  return (
    <div className="w-full h-8 border-b border-[#1F1F1F]">
      <div className="skeleton-shimmer w-full h-full" />
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
      <span className="text-[#A0A0A0] font-medium">{ticker.symbol}</span>
      <span className="text-[#E0E0E0]">{formatPrice(ticker.lastPrice)}</span>
      <span className={changeColor}>
        {arrow} {formattedChange}
      </span>
      <span className="text-[#333333] ml-2">·</span>
    </button>
  );
}

interface TickerPopupProps {
  ticker: Ticker24hr;
  onClose: () => void;
}

function TickerPopup({ ticker, onClose }: TickerPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changePercent = parseFloat(ticker.priceChangePercent);
  const isPositive = changePercent >= 0;
  const changeColor = isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]';

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 'var(--z-popover)' as React.CSSProperties['zIndex'] }}
      onClick={(e) => {
        if (!popupRef.current?.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={popupRef}
        className="absolute top-24 left-4 bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 min-w-[200px] shadow-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#E0E0E0] font-semibold text-sm">{ticker.symbol}</span>
          <span className={`text-xs font-medium ${changeColor}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
          </span>
        </div>

        <div className="space-y-2">
          <Row label="Price" value={formatPrice(ticker.lastPrice)} />
          <Row label="24h High" value={formatPrice(ticker.highPrice)} />
          <Row label="24h Low" value={formatPrice(ticker.lowPrice)} />
          <Row label="Volume" value={formatPrice(ticker.volume, 'USD', { compact: true, showCurrency: false })} valueSuffix={ticker.symbol.replace('USDT', '')} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueSuffix }: { label: string; value: string; valueSuffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#555555] text-xs">{label}</span>
      <span className="text-[#E0E0E0] text-xs font-medium">
        {value}{valueSuffix ? ` ${valueSuffix}` : ''}
      </span>
    </div>
  );
}
