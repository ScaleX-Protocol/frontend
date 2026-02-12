import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryCandlestick,
  VictoryAxis,
} from "victory-native";
import TradingViewChart from "./TradingViewChart";

const { width } = Dimensions.get("window");

interface ChartProps {
  chartData: any[];
  currentPrice: string;
  quoteDecimals: number;
  interval: string;
  onIntervalChange: (interval: string) => void;
  yDomain?: [number, number];
  yTicks?: number[];
  formatPriceLabel: (value: number) => string;
  xTickValues?: number[];
  formatTimeLabel: (value: number) => string;
}

const intervals = ["1m", "5m", "30m", "1h", "1d"];

export default function Chart({
  chartData,
  currentPrice,
  quoteDecimals,
  interval,
  onIntervalChange,
  yDomain,
  yTicks,
  formatPriceLabel,
  xTickValues,
  formatTimeLabel,
}: ChartProps) {
  // State to track if TradingView failed, forcing Victory fallback
  const [useTradingView, setUseTradingView] = useState(true);

  // Transform chartData for TradingView format
  const tradingViewData = chartData.map((d) => ({
    time: d.time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const handleTradingViewError = (error: Error) => {
    console.log(
      "[Chart] TradingView error, falling back to Victory Native:",
      error,
    );
    setUseTradingView(false);
  };

  return (
    <View style={styles.container}>
      {/* Interval Selector */}
      <View style={styles.intervalContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.intervalScroll}
        >
          {intervals.map((int) => (
            <TouchableOpacity
              key={int}
              style={[
                styles.intervalButton,
                interval === int && styles.intervalButtonActive,
              ]}
              onPress={() => onIntervalChange(int)}
            >
              <Text
                style={[
                  styles.intervalText,
                  interval === int && styles.intervalTextActive,
                ]}
              >
                {int}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chart Display */}
      <View style={styles.chartContainer}>
        {useTradingView ? (
          <TradingViewChart
            data={tradingViewData}
            onError={handleTradingViewError}
          />
        ) : (
          // Victory Native Fallback
          <View style={styles.victoryContainer}>
            <VictoryChart
              width={width}
              height={300}
              padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
              domain={{ y: yDomain }}
            >
              {/* Background grid */}
              <VictoryAxis
                crossAxis
                tickValues={xTickValues}
                tickFormat={formatTimeLabel}
                style={{
                  axis: { stroke: "rgba(224, 224, 224, 0.1)" },
                  ticks: { stroke: "rgba(224, 224, 224, 0.1)" },
                  tickLabels: {
                    fill: "#666666",
                    fontSize: 10,
                    padding: 5,
                  },
                  grid: {
                    stroke: "rgba(224, 224, 224, 0.1)",
                    strokeDasharray: "3, 3",
                  },
                }}
              />

              <VictoryAxis
                dependentAxis
                tickValues={yTicks}
                tickFormat={formatPriceLabel}
                style={{
                  axis: { stroke: "rgba(224, 224, 224, 0.1)" },
                  ticks: { stroke: "rgba(224, 224, 224, 0.1)" },
                  tickLabels: {
                    fill: "#666666",
                    fontSize: 10,
                    padding: 5,
                  },
                  grid: {
                    stroke: "rgba(224, 224, 224, 0.1)",
                    strokeDasharray: "3, 3",
                  },
                }}
              />

              {/* Candlestick chart */}
              <VictoryCandlestick
                data={chartData}
                x="time"
                open="open"
                close="close"
                high="high"
                low="low"
                candleColors={{ positive: "#2ECC71", negative: "#E74C3C" }}
                style={{
                  data: {
                    strokeWidth: 1,
                  },
                }}
              />
            </VictoryChart>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  intervalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 224, 224, 0.1)",
  },
  intervalScroll: {
    gap: 8,
    flexDirection: "row",
  },
  intervalButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.2)",
  },
  intervalButtonActive: {
    backgroundColor: "#F06718",
    borderColor: "#F06718",
  },
  intervalText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A0A0A0",
  },
  intervalTextActive: {
    color: "#FFFFFF",
  },
  chartContainer: {
    flex: 1,
  },
  victoryContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
