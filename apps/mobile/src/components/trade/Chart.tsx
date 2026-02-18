import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import TradingViewChart, { type CandlestickData } from "./TradingViewChart";

const INTERVALS = ["1m", "5m", "30m", "1h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

interface ChartProps {
  /** OHLCV data in TradingView Lightweight Charts format (time in Unix seconds) */
  chartData: CandlestickData[];
  currentPrice: string;
  quoteDecimals: number;
  symbol?: string;
  interval: string;
  onIntervalChange: (interval: Interval) => void;
}

export default function Chart({
  chartData,
  currentPrice,
  quoteDecimals,
  symbol,
  interval,
  onIntervalChange,
}: ChartProps) {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [tvFailed, setTvFailed] = useState(false);

  return (
    <View style={styles.container}>
      {/* Top bar: Interval Selector + Candle/Line Toggle */}
      <View style={styles.topBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.intervalScroll}
        >
          {INTERVALS.map((int) => (
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
                {int.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart type toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              chartType === "candle" && styles.typeButtonActive,
            ]}
            onPress={() => setChartType("candle")}
          >
            <Text
              style={[
                styles.typeText,
                chartType === "candle" && styles.typeTextActive,
              ]}
            >
              ▥
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              chartType === "line" && styles.typeButtonActive,
            ]}
            onPress={() => setChartType("line")}
          >
            <Text
              style={[
                styles.typeText,
                chartType === "line" && styles.typeTextActive,
              ]}
            >
              ∿
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart content */}
      <View style={styles.chartContainer}>
        <TradingViewChart
          data={chartData}
          chartType={chartType}
          symbol={symbol}
          onError={(err) => {
            console.warn("[Chart] TradingView failed, hiding chart:", err.message);
            setTvFailed(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224,224,224,0.08)",
  },
  intervalScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  intervalButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(224,224,224,0.15)",
  },
  intervalButtonActive: {
    backgroundColor: "#F06718",
    borderColor: "#F06718",
  },
  intervalText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#888888",
  },
  intervalTextActive: {
    color: "#FFFFFF",
  },
  typeToggle: {
    flexDirection: "row",
    marginLeft: 8,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(224,224,224,0.15)",
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  typeButtonActive: {
    backgroundColor: "rgba(240,103,24,0.2)",
  },
  typeText: {
    fontSize: 14,
    color: "#888888",
  },
  typeTextActive: {
    color: "#F06718",
  },
  chartContainer: {
    flex: 1,
    minHeight: 260,
  },
});
