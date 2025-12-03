import { useCallback, useState } from 'react';
import { usePairs } from '../../hooks/chart/usePairs';
import { useTradingViewSync } from '../../hooks/chart/useTradingViewSync';
import { useTradingViewWidget } from '../../hooks/chart/useTradingViewWidget';
import TradingViewContainer from './tradingViewContainer';
import { useTradingViewDatafeed } from '../../hooks/chart/useTradingViewDatafeed';

// type Interval = '1m' | '5m' | '30m' | '1h' | '1d';
type Interval = '1' | '5' | '30' | '60' | '1D';

export default function Chart({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState<Interval>('1');
  const { data: pairsData, isLoading: pairsLoading, error: pairsError } = usePairs();

  if (pairsLoading || pairsError || !pairsData) {
    console.log('error pairs');
    // Place to handler error pairs
  }

  // Note: TradingView handles its own data fetching via datafeed
  // No need for separate useKline hook since TradingView manages this internally

  // Create TradingView datafeed that handles its own data fetching
  const datafeed = useTradingViewDatafeed(
    pairsData,
    useCallback((interval: Interval) => {
      setInterval(interval);
    }, []),
  );
  console.log(datafeed);
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
