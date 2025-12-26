import { useEffect, useRef, useState } from 'react';
import { useTradingViewScript } from './useTradingViewScript';
import { logger } from '../../utils/prodLogger';

interface TradingViewWidget {
  onChartReady: (callback: () => void) => void;
  remove: () => void;
  setSymbol: (symbol: string, interval: string, callback?: () => void) => void;
}

interface UseTradingViewWidgetParams {
  containerId: string;
  symbol: string;
  interval: string;
  datafeed: unknown;
  theme?: 'Dark' | 'Light';
}

// Type for TradingView global - avoiding global declaration conflict
interface TradingViewGlobal {
  widget: new (config: unknown) => TradingViewWidget;
}

export function useTradingViewWidget(params: UseTradingViewWidgetParams) {
  const { containerId, symbol, interval, datafeed, theme = 'Dark' } = params;

  const widgetRef = useRef<TradingViewWidget | null>(null);
  const initialIntervalRef = useRef<string | null>(null);
  const initialSymbolRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const log = logger().withContext({ hook: 'useTradingViewWidget' });

  const { isLoaded, loadError } = useTradingViewScript();

  // Store initial interval and symbol on first render only
  if (initialIntervalRef.current === null) {
    initialIntervalRef.current = interval;
    initialSymbolRef.current = symbol;
  }

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (loadError) {
      return;
    }

    const container = document.getElementById(containerId);
    const tradingView = (window as unknown as { TradingView?: TradingViewGlobal }).TradingView;
    if (!container || !tradingView) {
      setTimeout(() => setError(new Error('Container or TradingView library not available')), 0);
      return;
    }

    // Only create widget once - don't recreate on interval/symbol changes
    if (widgetRef.current) {
      return;
    }

    try {
      // CRITICAL: Use GTX frontend approach - simple configuration
      const widget = new tradingView.widget({
        container: containerId,
        library_path: 'https://trading-view.scalex.money/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['symbol_search'],
        symbol: initialSymbolRef.current || symbol,
        interval: initialIntervalRef.current || interval,
        timezone: 'Asia/Jakarta',
        theme,
        autosize: true,
        datafeed,
        debug: false,
      });

      // CRITICAL: Use GTX approach - simple onChartReady
      widget.onChartReady(() => {
            setIsReady(true);
      });

      widgetRef.current = widget;
    } catch (err) {
      setTimeout(() => setError(err as Error), 0);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          log.warn('Error removing widget', e as Error);
        }
        widgetRef.current = null;
      }
      setIsReady(false);
    };
    // Intentionally omitting 'symbol' and 'interval' - widget is created once with initial values,
    // and all subsequent changes are handled via setSymbol() in useTradingViewSync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, loadError, containerId, datafeed, theme]);

  const getWidget = () => widgetRef.current;

  return {
    getWidget,
    isReady,
    error: loadError || error,
  };
}
