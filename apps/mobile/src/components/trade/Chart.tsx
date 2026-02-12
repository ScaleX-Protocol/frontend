import React from "react";
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
  return (
    <View style={styles.container}>
      {/* Interval Selector */}
      <View style={styles.intervalContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {intervals.map((int) => (
            <TouchableOpacity
              key={int}
              style={[
                styles.intervalButton,
                interval === int && styles.intervalActive,
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

      {/* Chart */}
      <View style={styles.chartWrapper}>
        <VictoryChart
          height={280}
          width={width - 40}
          padding={{ top: 10, bottom: 40, left: 50, right: 10 }}
          domain={
            yDomain ? { y: yDomain, x: [0, chartData.length - 1] } : undefined
          }
        >
          {/* Current Price Line */}
          {currentPrice && (
            <VictoryLine
              data={[
                {
                  x: 0,
                  y: parseFloat(currentPrice) / Math.pow(10, quoteDecimals),
                },
                {
                  x: chartData.length - 1,
                  y: parseFloat(currentPrice) / Math.pow(10, quoteDecimals),
                },
              ]}
              style={{
                data: {
                  stroke: "#E26B1D",
                  strokeWidth: 1,
                  strokeDasharray: "4,4",
                },
              }}
            />
          )}

          {/* Volume Bars */}
          <VictoryBar
            data={chartData}
            x="x"
            y="volume"
            style={{
              data: {
                fill: (d: any) =>
                  d.isPositive
                    ? "rgba(46, 204, 113, 0.3)"
                    : "rgba(231, 76, 60, 0.3)",
                width: 4,
              },
            }}
          />

          {/* Candlesticks */}
          <VictoryCandlestick
            data={chartData}
            open="open"
            close="close"
            high="high"
            low="low"
            candleColors={{ positive: "#2ECC71", negative: "#E74C3C" }}
            style={{
              data: {
                strokeWidth: 2,
              },
            }}
            candleWidth={8}
          />

          {/* Y-axis */}
          <VictoryAxis
            dependentAxis
            tickValues={yTicks}
            tickFormat={formatPriceLabel}
            style={{
              axis: { stroke: "#333" },
              tickLabels: { fill: "#888", fontSize: 10, padding: 8 },
              grid: { stroke: "#222", strokeDasharray: "2,2" },
            }}
          />

          {/* X-axis */}
          <VictoryAxis
            tickValues={xTickValues}
            tickFormat={formatTimeLabel}
            style={{
              axis: { stroke: "#333" },
              tickLabels: { fill: "#888", fontSize: 10, padding: 8 },
              grid: { stroke: "#222", strokeDasharray: "2,2" },
            }}
          />
        </VictoryChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  intervalContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "#1A1A1A",
  },
  intervalActive: {
    backgroundColor: "#E26B1D",
  },
  intervalText: {
    fontSize: 12,
    color: "#888888",
  },
  intervalTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chartWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
    minHeight: 280,
  },
});
