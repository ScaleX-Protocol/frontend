import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Endpoints } from '@/configs/endpoints';
import { logger } from '@/utils/prodLogger';
import { RESOLUTION_MAPPING } from '../../types/chart.types';
import type { TradingPair } from '../../types/chart.types';

type Interval = '1' | '5' | '30' | '60' | '1D';
type ChartType = 'candle' | 'line';

interface MiniappChartProps {
  symbol: string;
  interval: Interval;
  chartType: ChartType;
  pair: TradingPair | undefined;
  height: number;
}

interface ChartDataPoint {
  time: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const convertPrice = (value: string | number, decimals: number): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue / Math.pow(10, decimals);
};

const formatTime = (timestamp: number, interval: Interval): string => {
  const date = new Date(timestamp);

  if (interval === '1D') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded px-3 py-2 text-xs">
      <div className="text-[#888888] mb-1">{data.timeLabel}</div>
      <div className="space-y-0.5">
        <div className="text-[#AAAAAA]">
          O: <span className="text-white">{data.open.toFixed(6)}</span>
        </div>
        <div className="text-[#AAAAAA]">
          H: <span className="text-white">{data.high.toFixed(6)}</span>
        </div>
        <div className="text-[#AAAAAA]">
          L: <span className="text-white">{data.low.toFixed(6)}</span>
        </div>
        <div className="text-[#AAAAAA]">
          C: <span className="text-white">{data.close.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

export function MiniappChart({ symbol, interval, chartType, pair, height }: MiniappChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const log = logger.withContext({ component: 'MiniappChart' });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!symbol) {
          throw new Error('No symbol provided');
        }

        const mappedInterval = RESOLUTION_MAPPING[interval];
        if (!mappedInterval) {
          throw new Error('Unsupported interval');
        }

        // Use pair decimals if available, otherwise default to 6 (USDC decimals)
        const decimals = pair?.quoteDecimals ?? 6;
        const now = Date.now();
        const from = now - (24 * 60 * 60 * 1000); // Last 24 hours

        const searchParams = new URLSearchParams({
          symbol,
          interval: mappedInterval,
          startTime: from.toString(),
          endTime: now.toString(),
          limit: '100'
        });

        const url = `${Endpoints.indexer}/api/kline?${searchParams.toString()}`;
        log.debug('Fetching chart data', { url, symbol, interval });

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawData: any[] = await response.json();
        log.debug('Received chart data', { count: rawData.length });

        if (!rawData || rawData.length === 0) {
          log.warn('No chart data available', { symbol, interval });
          setData([]);
          setIsLoading(false);
          return;
        }

        const formattedData: ChartDataPoint[] = rawData.map((d: any) => {
          const timestamp = Array.isArray(d) ? d[0] : d.openTime;

          return {
            time: timestamp,
            timeLabel: formatTime(timestamp, interval),
            open: convertPrice(Array.isArray(d) ? d[1] : d.open, decimals),
            high: convertPrice(Array.isArray(d) ? d[2] : d.high, decimals),
            low: convertPrice(Array.isArray(d) ? d[3] : d.low, decimals),
            close: convertPrice(Array.isArray(d) ? d[4] : d.close, decimals),
            volume: Number(Array.isArray(d) ? d[5] : d.volume),
          };
        });

        formattedData.sort((a, b) => a.time - b.time);
        setData(formattedData);
        log.debug('Chart data formatted', { count: formattedData.length });
      } catch (err: any) {
        log.error('Failed to fetch chart data', { error: err.message, symbol, interval });
        setError(err.message || 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchChartData();
    } else {
      log.warn('No symbol provided to MiniappChart');
      setIsLoading(false);
    }
  }, [symbol, interval, pair]);

  const chartColor = useMemo(() => {
    if (data.length < 2) return '#10B981'; // green default

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;

    return lastPrice >= firstPrice ? '#10B981' : '#EF4444';
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-[#0A0A0A] border border-[#222222] rounded-[12px]" style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#404040] border-t-[#888888] rounded-full animate-spin" />
          <p className="text-[#666666] text-xs">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#0A0A0A] border border-[#222222] rounded-[12px] gap-2 p-4" style={{ height }}>
        <p className="text-[#666666] text-sm">{error || 'No data available'}</p>
        {!error && (
          <div className="text-[#555555] text-xs text-center">
            <div>Symbol: {symbol || 'none'}</div>
            <div>Interval: {interval}</div>
            <div>Pair: {pair ? 'loaded' : 'not loaded'}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-[12px] p-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timeLabel"
            stroke="#404040"
            tick={{ fill: '#666666', fontSize: 10 }}
            tickLine={{ stroke: '#404040' }}
            axisLine={{ stroke: '#222222' }}
            minTickGap={30}
          />

          <YAxis
            stroke="#404040"
            tick={{ fill: '#666666', fontSize: 10 }}
            tickLine={{ stroke: '#404040' }}
            axisLine={{ stroke: '#222222' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => value.toFixed(6)}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="close"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#colorPrice)"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
