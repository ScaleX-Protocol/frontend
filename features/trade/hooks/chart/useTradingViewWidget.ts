import { useEffect, useRef, useState } from 'react';
import { useTradingViewScript } from './useTradingViewScript';

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

declare global {
  interface Window {
    TradingView: {
      widget: new (config: unknown) => TradingViewWidget;
    };
  }
}

export function useTradingViewWidget(params: UseTradingViewWidgetParams) {
  const { containerId, symbol, interval, datafeed, theme = 'Dark' } = params;

  const widgetRef = useRef<TradingViewWidget | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isLoaded, loadError } = useTradingViewScript();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (loadError) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container || !window.TradingView) {
      setTimeout(() => setError(new Error('Container or TradingView library not available')), 0);
      return;
    }

    try {
      const widget = new window.TradingView.widget({
        container: containerId,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['symbol_search'],
        symbol,
        interval,
        timezone: 'Asia/Jakarta',
        theme,
        autosize: true,
        datafeed,
        debug: false,
      });

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
          console.warn('Error removing widget:', e);
        }
        widgetRef.current = null;
      }
      setIsReady(false);
    };
  }, [isLoaded, loadError, containerId, symbol, interval, datafeed, theme]);

  const getWidget = () => widgetRef.current;

  return {
    getWidget,
    isReady,
    error: loadError || error,
  };
}
