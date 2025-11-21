import { useState } from 'react';
import { useKline, type UseKlineParams } from '../../hooks/chart/useKline';
import { usePairs } from '../../hooks/chart/usePairs';
import { useTradingViewWidget } from '../../hooks/chart/useTradingViewWidget';
import { useTradingViewSync } from '../../hooks/chart/useTradingViewSync';
import TradingViewContainer from './tradingViewContainer';

export default function Chart({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState<'1m' | '5m' | '30m' | '1h' | '1d'>('1h');
  const { data: pairsData, isLoading: pairsLoading, error: pairsError } = usePairs();

  if (pairsLoading || pairsError || !pairsData) {
    console.log('error pairs');
    // Place to handler error pairs
  }

  const params: UseKlineParams = {
    symbol: symbol,
    interval: interval,
    startTime: 1,
    endTime: 10,
    limit: 10,
  };

  const { data: klineData, isLoading: klineLoading, error: klineError } = useKline(params);
  if (klineLoading || klineError || !klineData) {
    console.log('error kline');
    // Place to handler error kline
  }

  // need kline data to create a new logic for datafeed, it will execute in next step
  const datafeed = '';
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

  return (
    <div className="w-full h-full bg-[#2C2C2C] rounded-md">
      <TradingViewContainer height={height} isReady={isReady} error={error} />
    </div>
  );
}
