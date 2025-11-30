import { useEffect, useRef } from 'react';

interface TradingViewWidget {
  setSymbol: (symbol: string, interval: string, callback?: () => void) => void;
}

export function useTradingViewSync(
  getWidget: () => TradingViewWidget | null,
  symbol: string,
  interval: string,
  isReady: boolean,
) {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const lastSymbolRef = useRef<string>(symbol);
  const lastIntervalRef = useRef<string>(interval);

  useEffect(() => {
    const widget = getWidget();
    if (!widget || !isReady) return;

    // Only update if symbol or interval actually changed
    const symbolChanged = lastSymbolRef.current !== symbol;
    const intervalChanged = lastIntervalRef.current !== interval;

    if (!symbolChanged && !intervalChanged) {
      return;
    }

    // Update refs
    lastSymbolRef.current = symbol;
    lastIntervalRef.current = interval;

    // Debounce symbol/interval changes
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        widget.setSymbol(symbol, interval, () => {
          console.log('Symbol/Interval changed to:', symbol, interval);
        });
      } catch (error) {
        console.error('Error changing symbol/interval:', error);
      }
    }, 100); // Reduced debounce time for better responsiveness

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [getWidget, symbol, interval, isReady]);
}
