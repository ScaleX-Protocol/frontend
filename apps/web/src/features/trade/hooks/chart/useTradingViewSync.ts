import { useEffect, useRef } from 'react';
import { logger } from '@/utils/prodLogger';
import { TradingViewWidget } from '../../types/chart.types';

export function useTradingViewSync(
  getWidget: () => TradingViewWidget | null,
  symbol: string,
  interval: string,
  isReady: boolean,
) {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const lastSymbolRef = useRef<string | null>(null);
  const lastIntervalRef = useRef<string | null>(null);
  const isFirstSync = useRef(true);
  const log = logger.withContext({ hook: 'useTradingViewSync' });

  useEffect(() => {
    const widget = getWidget();
    if (!widget || !isReady) return;

    // Skip the first sync since widget is initialized with correct values
    if (isFirstSync.current) {
      lastSymbolRef.current = symbol;
      lastIntervalRef.current = interval;
      isFirstSync.current = false;
      return;
    }

    // Only update if symbol or interval actually changed
    const symbolChanged = lastSymbolRef.current !== symbol;
    const intervalChanged = lastIntervalRef.current !== interval;

    if (!symbolChanged && !intervalChanged) {
      return;
    }

    // Update refs immediately
    lastSymbolRef.current = symbol;
    lastIntervalRef.current = interval;

    // Debounce changes
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        if (symbolChanged) {
          // If symbol changed, use setSymbol which also accepts interval
          widget.setSymbol(symbol, interval, () => {
            log.debug('Symbol changed', { symbol, interval });
          });
        } else if (intervalChanged) {
          // If only interval changed, use setResolution on the active chart
          try {
            widget.activeChart().setResolution(interval, () => {
              log.debug('Interval changed', { interval });
            });
          } catch {
            // Fallback to setSymbol if setResolution fails
            widget.setSymbol(symbol, interval, () => {
              log.debug('Interval changed via setSymbol', { symbol, interval });
            });
          }
        }
      } catch (error) {
        log.error('Error changing symbol/interval', error);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [getWidget, symbol, interval, isReady, log]);
}
