import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import WebView from "react-native-webview";

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingViewChartProps {
  data: CandlestickData[];
  onError?: (error: Error) => void;
}

export default function TradingViewChart({
  data,
  onError,
}: TradingViewChartProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // HTML content for TradingView Lightweight Charts
  const chartHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            background: #000000;
            overflow: hidden;
          }
          #chart {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="chart"></div>
        
        <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
        
        <script>
          try {
            const chart = LightweightCharts.createChart(document.getElementById('chart'), {
              layout: {
                background: { color: '#000000' },
                textColor: '#888888',
              },
              grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
              },
              crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
              },
              rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.3)',
              },
              timeScale: {
                borderColor: 'rgba(42, 46, 57, 0.3)',
                timeVisible: true,
                secondsVisible: false,
              },
              handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
              },
              handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
              },
            });

            const candlestickSeries = chart.addCandlestickSeries({
              upColor: '#10B981',
              downColor: '#EF4444',
              borderVisible: false,
              wickUpColor: '#10B981',
              wickDownColor: '#EF4444',
            });

            // Auto-resize chart
            window.addEventListener('resize', () => {
              chart.applyOptions({ 
                width: window.innerWidth,
                height: window.innerHeight 
              });
            });

            // Listen for data updates from React Native
            window.addEventListener('message', (event) => {
              try {
                const  message = JSON.parse(event.data);
                
                if (message.type === 'UPDATE_DATA' && message.data) {
                  // Set candlestick data
                  candlestickSeries.setData(message.data);
                  
                  // Fit content to view
                  chart.timeScale().fitContent();
                  
                  // Notify React Native that update was successful
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'DATA_UPDATED',
                    success: true 
                  }));
                }
              } catch (error) {
                console.error('Error processing message:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'ERROR',
                  message: error.toString()
                }));
              }
            });

            // Notify React Native that chart is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'CHART_READY' 
            }));
          } catch (error) {
            console.error('Error initializing chart:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'INIT_ERROR',
              message: error.toString()
            }));
          }
        </script>
      </body>
    </html>
  `;

  // Send data to WebView when data changes
  useEffect(() => {
    if (webViewRef.current && data && data.length > 0) {
      const message = JSON.stringify({
        type: "UPDATE_DATA",
        data: data,
      });

      webViewRef.current.postMessage(message);
    }
  }, [data]);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "CHART_READY":
          setIsLoading(false);
          break;

        case "DATA_UPDATED":
          // Chart data updated successfully
          break;

        case "ERROR":
        case "INIT_ERROR":
          console.error("[TradingView] Error:", message.message);
          setHasError(true);
          setIsLoading(false);
          onError?.(new Error(message.message));
          break;
      }
    } catch (error) {
      console.error("[TradingView] Failed to parse message:", error);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("[TradingView] WebView error:", nativeEvent);
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error("WebView failed to load"));
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load TradingView chart</Text>
        <Text style={styles.errorSubtext}>Falling back to native chart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F06718" />
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: chartHTML }}
        style={[styles.webview, isLoading && styles.hidden]}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888888",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
});
