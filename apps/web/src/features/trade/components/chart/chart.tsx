import { useCallback, useState } from 'react';
import { usePairs } from '../../hooks/chart/usePairs';
import { useTradingViewSync } from '../../hooks/chart/useTradingViewSync';
import { useTradingViewWidget } from '../../hooks/chart/useTradingViewWidget';
import TradingViewContainer from './tradingViewContainer';
import { useTradingViewDatafeed } from '../../hooks/chart/useTradingViewDatafeed';
import { logger } from '@/utils/prodLogger';
import { TokenIcon } from '../tokenIcon';

type Interval = '1' | '5' | '30' | '60' | '1D';

const log = logger.withContext({ component: 'Chart' });

const TIMEFRAMES: { label: string; value: Interval }[] = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '30m', value: '30' },
  { label: '1H', value: '60' },
  { label: '1D', value: '1D' },
];

interface ChartProps {
  symbol: string;
  currentPrice?: string;
  priceChange?: number;
  highPrice?: string;
  lowPrice?: string;
  volume?: string;
  baseAsset?: string;
  quoteAsset?: string;
  onMarketClick?: () => void;
}

export default function Chart({ 
  symbol, 
  currentPrice = '--',
  priceChange = 0,
  highPrice = '--',
  lowPrice = '--',
  volume = '0',
  baseAsset = '',
  quoteAsset = '',
  onMarketClick
}: ChartProps) {
  const [interval, setInterval] = useState<Interval>('60');
  const { data: pairsData, isLoading: pairsLoading, error: pairsError } = usePairs();

  if (pairsLoading || pairsError || !pairsData) {
    log.error('Error loading pairs data', { pairsLoading, pairsError, hasData: !!pairsData });
  }

  const datafeed = useTradingViewDatafeed(
    pairsData,
    useCallback((interval: Interval) => {
      setInterval(interval);
    }, []),
  );
  
  const theme = 'Dark';
  const height = '100%';
  const { getWidget, isReady, error } = useTradingViewWidget({
    containerId: 'tv_chart_container',
    symbol,
    interval,
    datafeed,
    theme,
  });

  useTradingViewSync(getWidget, symbol, interval, isReady);

  const isPositiveChange = priceChange >= 0;

  return (
    <div className="w-full h-full bg-[#242424] rounded-[20px] border border-[#404040] overflow-hidden flex flex-col">
      {/* Market Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A3A]">
        {/* Market Pair - Clickable to open market selector */}
        <button
          type="button"
          onClick={onMarketClick}
          className="flex items-center gap-2 hover:bg-[#3A3A3A] px-2 py-1 rounded-md transition-colors cursor-pointer"
        >
          <TokenIcon symbol={baseAsset} size="sm" />
          <span className="text-[#E0E0E0] text-sm">
            {baseAsset} / {quoteAsset}
          </span>
          <svg className="w-3 h-3 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-9 bg-[#A3A3A3]" />

        {/* Current Price */}
        <div className="flex items-center gap-2">
          <span className={`${isPositiveChange ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
            ${currentPrice}
          </span>
          <div className={`${isPositiveChange ? 'bg-[#10B981]/10' : 'bg-[#E74C3C]/10' } px-1.5 py-0.5 rounded`}>
            <span className={`text-xs font-medium ${isPositiveChange ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              {isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-9 bg-[#A3A3A3]" />

        {/* 24H Stats */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-fit">
            <span className="text-[#99A1AF] text-xs font-dm-sans">24H Change</span>
            <span className={`text-sm font-dm-sans ${isPositiveChange ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>{isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%</span>
          </div>
          <div className="flex flex-col items-center justify-center w-fit">
            <span className="text-[#99A1AF] text-xs font-dm-sans">24H High</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">${highPrice}</span>
          </div>
          <div className="flex flex-col items-center justify-center w-fit">
            <span className="text-[#99A1AF] text-xs font-dm-sans">24H Low</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">${lowPrice}</span>
          </div>
          <div className="flex flex-col items-center justify-center w-fit">
            <span className="text-[#99A1AF] text-xs font-dm-sans">24H Volume</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">{volume} {baseAsset}</span>
          </div>
        </div>
      </div>

      {/* Chart Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3A3A3A]">
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setInterval(tf.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                interval === tf.value
                  ? 'bg-[#3A3A3A] text-[#E0E0E0]'
                  : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#3A3A3A]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart Tools */}
        <div className="flex items-center gap-1 text-[#A0A0A0] text-xs">
          <span>% log</span>
          <span className="text-[#F06718]">auto</span>
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="flex-1">
        <TradingViewContainer height={height} isReady={isReady} error={error} />
      </div>
    </div>
  );
}
