import { useEffect, useRef, useState } from 'react';
import { useTradingViewScript } from './useTradingViewScript';
import { logger } from '@/utils/prodLogger';
import { TradingViewWidget } from '../../types/chart.types';


interface UseTradingViewWidgetParams {
  containerId: string;
  symbol: string;
  interval: string;
  datafeed: unknown;
  theme?: 'Dark' | 'Light';
  variant?: 'desktop' | 'mobile';
  chartType?: 'candle' | 'line';
}

// TradingView chart type constants
// 1 = Candlestick, 2 = Line, 3 = Area
const CHART_TYPE_MAP = {
  candle: 1,
  line: 3, // Using Area (3) for filled line chart like the reference
};

export function useTradingViewWidget(params: UseTradingViewWidgetParams) {
  const { 
    containerId, 
    symbol, 
    interval, 
    datafeed, 
    theme = 'Dark',
    variant = 'desktop',
    chartType = 'candle'
  } = params;

  const widgetRef = useRef<TradingViewWidget | null>(null);
  const initialIntervalRef = useRef<string | null>(null);
  const initialSymbolRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const log = logger.withContext({ hook: 'useTradingViewWidget' });

  const { isLoaded, loadError } = useTradingViewScript();

  // Store initial interval and symbol on first render only
  if (initialIntervalRef.current === null) {
    initialIntervalRef.current = interval;
    initialSymbolRef.current = symbol;
  }

  // Base disabled features for all variants
  const baseDisabledFeatures = [
    'use_localstorage_for_settings',
    'header_symbol_search',
    'header_compare',
    'header_undo_redo',
    'header_screenshot',
    'header_saveload',
    'header_settings',
    'header_fullscreen_button',
    'header_indicators',
    'header_chart_type',
    'header_resolutions',
    'header_widget',
    'control_bar',
    'timeframes_toolbar',
    'display_market_status',
  ];

  // Additional disabled features for mobile - cleaner UI
  const mobileDisabledFeatures = [
    ...baseDisabledFeatures,
    'left_toolbar',
    'context_menus',
    'edit_buttons_in_legend',
    'border_around_the_chart',
    'main_series_scale_menu',
    'scales_date_format',
    'symbol_info',
    'legend_widget',
    'go_to_date',
    'timezone_menu',
  ];

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (loadError) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      const error = new Error('Chart container not found');
      log.error('Container missing', { containerId });
      setTimeout(() => setError(error), 0);
      return;
    }

    if (!window.TradingView) {
      const error = new Error('TradingView library failed to load');
      log.error('TradingView not available - likely blocked in miniapp environment', {
        userAgent: navigator.userAgent,
        isLoaded,
        loadError: loadError?.message
      });
      setTimeout(() => setError(error), 0);
      return;
    }

    // Only create widget once - don't recreate on interval/symbol changes
    if (widgetRef.current) {
      return;
    }

    const disabledFeatures = variant === 'mobile' ? mobileDisabledFeatures : baseDisabledFeatures;

    // Mobile-specific overrides for cleaner appearance
    const mobileOverrides = {
      'paneProperties.background': '#000000',
      'paneProperties.backgroundType': 'solid',
      'paneProperties.vertGridProperties.color': 'rgba(42, 46, 57, 0.3)',
      'paneProperties.horzGridProperties.color': 'rgba(42, 46, 57, 0.3)',
      'scalesProperties.backgroundColor': '#000000',
      'scalesProperties.lineColor': 'rgba(42, 46, 57, 0.3)',
      'scalesProperties.textColor': '#888888',
      'scalesProperties.fontSize': 10,
      'mainSeriesProperties.areaStyle.color1': 'rgba(16, 185, 129, 0.28)',
      'mainSeriesProperties.areaStyle.color2': 'rgba(16, 185, 129, 0.05)',
      'mainSeriesProperties.areaStyle.linecolor': '#10B981',
      'mainSeriesProperties.areaStyle.linewidth': 2,
      'mainSeriesProperties.candleStyle.upColor': '#10B981',
      'mainSeriesProperties.candleStyle.downColor': '#EF4444',
      'mainSeriesProperties.candleStyle.borderUpColor': '#10B981',
      'mainSeriesProperties.candleStyle.borderDownColor': '#EF4444',
      'mainSeriesProperties.candleStyle.wickUpColor': '#10B981',
      'mainSeriesProperties.candleStyle.wickDownColor': '#EF4444',
    };

    try {
      // CRITICAL: Use GTX frontend approach - simple configuration
      const widget = new window.TradingView.widget({
        container: containerId,
        library_path: 'https://trading-view.scalex.money/charting_library/',
        locale: 'en',
        disabled_features: disabledFeatures,
        enabled_features: variant === 'mobile' 
          ? [] 
          : ['side_toolbar_in_fullscreen_mode'],
        symbol: initialSymbolRef.current || symbol,
        interval: initialIntervalRef.current || interval,
        timezone: 'Asia/Jakarta',
        theme,
        autosize: true,
        datafeed,
        debug: false,
        hide_top_toolbar: true,
        hide_side_toolbar: variant === 'mobile',
        overrides: variant === 'mobile' ? mobileOverrides : undefined,
        load_last_chart: false,
      });

      // CRITICAL: Use GTX approach - simple onChartReady
      widget.onChartReady(() => {
        // Set initial chart type based on variant
        if (variant === 'mobile') {
          try {
            // For mobile, start with line chart by default for cleaner look
            widget.activeChart().setChartType(CHART_TYPE_MAP[chartType]);
          } catch (e) {
            log.warn('Error setting initial chart type', e as Error);
          }
        }
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
  }, [isLoaded, loadError, containerId, datafeed, theme, variant]);

  // Effect to handle chart type changes after widget is ready
  useEffect(() => {
    if (!isReady || !widgetRef.current) return;
    
    try {
      widgetRef.current.activeChart().setChartType(CHART_TYPE_MAP[chartType]);
    } catch (e) {
      log.warn('Error changing chart type', e as Error);
    }
  }, [chartType, isReady, log]);

  const getWidget = () => widgetRef.current;

  return {
    getWidget,
    isReady,
    error: loadError || error,
  };
}
