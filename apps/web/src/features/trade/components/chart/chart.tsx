import { useCallback, useState, useMemo } from 'react';
import { usePairs } from '@scalex/api';
import { useTradingViewSync } from '../../hooks/chart/useTradingViewSync';
import { useTradingViewWidget } from '../../hooks/chart/useTradingViewWidget';
import TradingViewContainer from './tradingViewContainer';
import { MiniappChart } from './MiniappChart';
import { useTradingViewDatafeed } from '../../hooks/chart/useTradingViewDatafeed';
import { logger } from '@/utils/prodLogger';
import { TokenIcon } from '@/components/common/TokenIcon';
import { ChevronDown } from 'lucide-react';
import { isMobileDevice } from '@/utils/detectMiniapp';

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
  variant?: 'desktop' | 'mobile';
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
  onMarketClick,
  variant = 'desktop'
}: ChartProps) {
  const [interval, setInterval] = useState<Interval>('5');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  // STEP 1: Testing usePairs - PASSED ✓
  const { data: pairsData, isLoading: pairsLoading, error: pairsError } = usePairs();

  if (pairsLoading || pairsError || !pairsData) {
    log.error('Error loading pairs data', { pairsLoading, pairsError, hasData: !!pairsData });
  }

  // STEP 2: Testing useTradingViewDatafeed
  const datafeed = useTradingViewDatafeed(
    pairsData,
    useCallback((interval: Interval) => {
      setInterval(interval);
    }, []),
  );

  // STEP 3: Testing useTradingViewWidget
  const theme = 'Dark';
  const height = '100%';
  const { getWidget, isReady, error } = useTradingViewWidget({
    containerId: 'tv_chart_container',
    symbol,
    interval,
    datafeed,
    theme,
    variant,
    chartType,
  });

  // STEP 4: Testing useTradingViewSync
  useTradingViewSync(getWidget, symbol, interval, isReady);

  const isPositiveChange = priceChange >= 0;

  // Mobile variant: simplified chart without header
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col h-full">
        {/* Compact Timeframe Buttons */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#222222]">
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setInterval(tf.value)}
                className={`px-2 py-0.5 text-[10px] font-medium leading-[14px] rounded transition-colors ${
                  interval === tf.value
                    ? 'bg-[#FFFFFF] text-[#000000]'
                    : 'text-[#888888] hover:text-[#E0E0E0]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-0.5 bg-[#2A2A2A] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setChartType('candle')}
              className={`p-1 rounded-full transition-colors ${
                chartType === 'candle' ? 'bg-[#F06718]' : 'hover:bg-[#3A3A3A]'
              }`}
              title="Candlestick"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <title>Candlestick</title>
                <rect x="3" y="4" width="2" height="8" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
                <rect x="7" y="2" width="2" height="12" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
                <rect x="11" y="5" width="2" height="6" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1 rounded-full transition-colors ${
                chartType === 'line' ? 'bg-[#F06718]' : 'hover:bg-[#3A3A3A]'
              }`}
              title="Line Chart"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <title>Line Chart</title>
                <path 
                  d="M2 12L5 8L9 10L14 4" 
                  stroke={chartType === 'line' ? '#FFF' : '#6B7280'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full">
          <TradingViewContainer height={height} isReady={isReady} error={error} />
        </div>
      </div>
    );
  }

  // Desktop variant: full chart with header
  return (
    <div className='flex flex-col gap-4 h-fit'>
      <div className='p-4 rounded-[16px] bg-[#0A0A0A] border border-[#404040] flex items-center justify-between'>
        <div className='flex gap-4'>
          <div className="flex items-center -space-x-2">
            <div className="z-10">
              <TokenIcon symbol={baseAsset} size="md" />
            </div>
            <div className="z-0">
              <TokenIcon symbol={quoteAsset} size="md" />
            </div>
          </div>
          <div className='flex flex-col gap-0.5'>
            <button 
              type="button"
              onClick={onMarketClick}
              className="group flex items-center gap-2 cursor-pointer"
            >
              <span className="text-[#FFFFFF] text-lg font-semibold leading-[28px]">
                {baseAsset} / {quoteAsset}
              </span>
              <ChevronDown className="w-5 h-5 text-[#FFFFFF] group-hover:rotate-180 transition-all duration-300 ease-out" />
            </button>
            <div className='flex gap-3 items-center'>
              <span className="text-[#FFFFFF] text-2xl font-semibold leading-[32px]">
                ${currentPrice}
              </span>
              <div className={`px-1.5 py-0.5 flex items-center rounded-[4px] ${isPositiveChange ? 'bg-[#10B981]/10' : 'bg-[#EF4444]/10'}`}>
                <span className={`text-[10px] leading-[16px] font-medium ${isPositiveChange ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[#555555] text-[10px] leading-[16px]">24H HIGH</span>
            <span className="text-[#CCCCCC] text-xs leading-[16px]">${highPrice}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#555555] text-[10px] leading-[16px]">24H LOW</span>
            <span className="text-[#CCCCCC] text-xs leading-[16px]">${lowPrice}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#555555] text-[10px] leading-[16px]">24H VOLUME</span>
            <span className="text-[#CCCCCC] text-xs leading-[16px]">${volume}</span>
          </div>
        </div>
      </div>
    
      <div className='bg-[#0A0A0A] border border-[#404040] rounded-[16px] flex-1 flex flex-col min-h-[400px] max-h-[400px] overflow-auto'>
        <div className="flex items-center justify-between px-4 py-2">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setInterval(tf.value)}
                className={`px-3 py-1 text-xs font-medium leading-[16px] rounded-[6px] transition-colors ${
                  interval === tf.value
                    ? 'bg-[#FFFFFF] text-[#000000]'
                    : 'text-[#888888] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex md:hidden items-center gap-1 bg-[#2A2A2A] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setChartType('candle')}
              className={`p-1.5 rounded-full transition-colors ${
                chartType === 'candle' ? 'bg-[#F06718]' : 'hover:bg-[#3A3A3A]'
              }`}
              title="Candlestick"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <title>Candlestick Chart</title>
                <rect x="3" y="4" width="2" height="8" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
                <rect x="7" y="2" width="2" height="12" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
                <rect x="11" y="5" width="2" height="6" rx="0.5" fill={chartType === 'candle' ? '#FFF' : '#6B7280'} />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-full transition-colors ${
                chartType === 'line' ? 'bg-[#F06718]' : 'hover:bg-[#3A3A3A]'
              }`}
              title="Line Chart"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <title>Line Chart</title>
                <path 
                  d="M2 12L5 8L9 10L14 4" 
                  stroke={chartType === 'line' ? '#FFF' : '#6B7280'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 w-full h-full">
          <TradingViewContainer height={height} isReady={isReady} error={error} />
        </div>
      </div>
    </div>
  );
}
