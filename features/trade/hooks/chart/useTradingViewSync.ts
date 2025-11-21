import { useEffect, useRef } from 'react';

interface TradingViewWidget {
  setSymbol: (symbol: string, interval: string, callback?: () => void) => void;
}

export function useTradingViewSync(getWidget: () => TradingViewWidget | null, symbol: string, interval: string, isReady: boolean) {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    const widget = getWidget();
    if (!widget || !isReady) return;

    // Debounce symbol changes
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        widget.setSymbol(symbol, interval, () => {
          console.log('Symbol changed to:', symbol);
        });
      } catch (error) {
        console.error('Error changing symbol:', error);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [getWidget, symbol, interval, isReady]);
}
