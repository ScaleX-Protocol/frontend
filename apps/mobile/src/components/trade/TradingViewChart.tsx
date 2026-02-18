import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import WebView from "react-native-webview";

export interface CandlestickData {
  /** Unix timestamp in SECONDS (not milliseconds) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingViewChartProps {
  data: CandlestickData[];
  chartType?: "candle" | "line";
  symbol?: string;
  onError?: (error: Error) => void;
}

/** Inline HTML that embeds TradingView Lightweight Charts from CDN */
const buildChartHTML = () => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      #chart { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="chart"></div>
    <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
    <script>
      var chart = null;
      var series = null;
      var pendingMessage = null;
      var isReady = false;

      function postToRN(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }

      function initChart() {
        try {
          chart = LightweightCharts.createChart(document.getElementById('chart'), {
            layout: {
              background: { color: '#000000' },
              textColor: '#888888',
            },
            grid: {
              vertLines: { color: 'rgba(42,46,57,0.3)' },
              horzLines: { color: 'rgba(42,46,57,0.3)' },
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: {
              borderColor: 'rgba(42,46,57,0.3)',
              scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
              borderColor: 'rgba(42,46,57,0.3)',
              timeVisible: true,
              secondsVisible: false,
              rightOffset: 5,
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
            handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
          });

          series = chart.addCandlestickSeries({
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
          });

          window.addEventListener('resize', function() {
            if (chart) chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
          });

          isReady = true;
          postToRN({ type: 'CHART_READY' });

          // Process any message that arrived before we were ready
          if (pendingMessage) {
            processMessage(pendingMessage);
            pendingMessage = null;
          }
        } catch (e) {
          postToRN({ type: 'INIT_ERROR', message: String(e) });
        }
      }

      function applyData(data) {
        if (!series || !data || !data.length) return;
        try {
          // Sort by time ascending — required by lightweight-charts
          var sorted = data.slice().sort(function(a, b) { return a.time - b.time; });
          series.setData(sorted);
          chart.timeScale().fitContent();
          postToRN({ type: 'DATA_UPDATED', count: sorted.length });
        } catch (e) {
          postToRN({ type: 'ERROR', message: 'setData failed: ' + String(e) });
        }
      }

      function applyChartType(type) {
        if (!chart) return;
        try {
          // Remove old series
          if (series) chart.removeSeries(series);

          if (type === 'line') {
            series = chart.addAreaSeries({
              lineColor: '#10B981',
              topColor: 'rgba(16,185,129,0.28)',
              bottomColor: 'rgba(16,185,129,0.05)',
              lineWidth: 2,
            });
          } else {
            series = chart.addCandlestickSeries({
              upColor: '#10B981',
              downColor: '#EF4444',
              borderVisible: false,
              wickUpColor: '#10B981',
              wickDownColor: '#EF4444',
            });
          }

          if (pendingMessage && pendingMessage.data) {
            applyData(pendingMessage.data);
          }
        } catch (e) {
          postToRN({ type: 'ERROR', message: 'chartType failed: ' + String(e) });
        }
      }

      function processMessage(message) {
        if (message.type === 'UPDATE_DATA' && message.data) {
          pendingMessage = message;
          if (isReady) {
            applyData(message.data);
          }
        } else if (message.type === 'SET_CHART_TYPE' && message.chartType) {
          applyChartType(message.chartType);
        }
      }

      // Listen for messages from React Native
      document.addEventListener('message', function(event) {
        try { processMessage(JSON.parse(event.data)); } catch(e) {}
      });
      window.addEventListener('message', function(event) {
        try { processMessage(JSON.parse(event.data)); } catch(e) {}
      });

      // Wait for lightweight-charts to be available then init
      function waitForLib(attempts) {
        if (typeof LightweightCharts !== 'undefined') {
          initChart();
        } else if (attempts > 0) {
          setTimeout(function() { waitForLib(attempts - 1); }, 100);
        } else {
          postToRN({ type: 'INIT_ERROR', message: 'lightweight-charts failed to load' });
        }
      }
      waitForLib(50); // Up to 5 seconds
    </script>
  </body>
</html>
`;

export default function TradingViewChart({
  data,
  chartType = "candle",
  symbol,
  onError,
}: TradingViewChartProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isReadyRef = useRef(false);
  const pendingDataRef = useRef<CandlestickData[] | null>(null);
  const currentChartTypeRef = useRef<"candle" | "line">("candle");

  const sendToWebView = useCallback((msg: object) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, []);

  // When data changes: send to WebView if ready, otherwise queue it
  useEffect(() => {
    if (!data || data.length === 0) return;
    if (isReadyRef.current) {
      sendToWebView({ type: "UPDATE_DATA", data });
    } else {
      pendingDataRef.current = data;
    }
  }, [data, sendToWebView]);

  // When chartType changes: send to WebView
  useEffect(() => {
    if (!isReadyRef.current) return;
    if (chartType !== currentChartTypeRef.current) {
      currentChartTypeRef.current = chartType;
      sendToWebView({ type: "SET_CHART_TYPE", chartType });
      // Re-send data after type change
      if (data && data.length > 0) {
        setTimeout(() => sendToWebView({ type: "UPDATE_DATA", data }), 100);
      }
    }
  }, [chartType, data, sendToWebView]);

  const handleMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case "CHART_READY":
          isReadyRef.current = true;
          setIsLoading(false);
          // Flush any queued data
          if (pendingDataRef.current) {
            sendToWebView({ type: "UPDATE_DATA", data: pendingDataRef.current });
            pendingDataRef.current = null;
          }
          // Apply current chart type if not default
          if (chartType !== "candle") {
            sendToWebView({ type: "SET_CHART_TYPE", chartType });
          }
          break;
        case "DATA_UPDATED":
          // Chart data applied successfully
          break;
        case "ERROR":
        case "INIT_ERROR":
          console.error("[TradingViewChart] Error:", message.message);
          setHasError(true);
          setIsLoading(false);
          onError?.(new Error(message.message));
          break;
      }
    } catch (e) {
      console.error("[TradingViewChart] Failed to parse message:", e);
    }
  }, [chartType, data, sendToWebView, onError]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("[TradingViewChart] WebView error:", nativeEvent);
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error("WebView failed to load"));
  }, [onError]);

  const handleRetry = () => {
    isReadyRef.current = false;
    pendingDataRef.current = data;
    setHasError(false);
    setIsLoading(true);
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chart failed to load</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F06718" />
          <Text style={styles.loadingText}>Loading chart…</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: buildChartHTML() }}
        style={[styles.webview, isLoading && styles.hidden]}
        onMessage={handleMessage}
        onError={handleWebViewError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  webview: { flex: 1, backgroundColor: "#000000" },
  hidden: { opacity: 0 },
  loadingContainer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    zIndex: 1,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888888" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
  },
  errorText: { fontSize: 15, color: "#888888", textAlign: "center", marginBottom: 16 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#F06718",
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});
