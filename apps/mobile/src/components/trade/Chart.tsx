import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import TradingViewChart, { type CandlestickData } from "./TradingViewChart";
import { useKline } from "~/src/hooks/trading";
import type { MarketInfo } from "./types";
import { toSymbol } from "./types";

export const INTERVALS = ["1m", "5m", "30m", "1h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function usePulse() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonChart() {
  const opacity = usePulse();
  return (
    <View style={styles.skeletonContainer}>
      {/* interval strip */}
      <View style={styles.skeletonTopBar}>
        {INTERVALS.map((i) => (
          <Animated.View
            key={i}
            style={{
              width: 36,
              height: 26,
              borderRadius: 6,
              backgroundColor: "#2A2A2A",
              opacity,
            }}
          />
        ))}
      </View>
      {/* chart area */}
      <Animated.View
        style={{ flex: 1, backgroundColor: "#151515", opacity, borderRadius: 4, margin: 8 }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Kline data transformation (moved from trade.tsx)
// ---------------------------------------------------------------------------

function transformKline(
  klineData: unknown[],
  quoteDecimals: number
): CandlestickData[] {
  const scale = Math.pow(10, quoteDecimals);
  return klineData
    .map((kline) => {
      let openTime: number;
      let openRaw: number;
      let highRaw: number;
      let lowRaw: number;
      let closeRaw: number;

      if (Array.isArray(kline)) {
        const k = kline as (string | number)[];
        openTime = Number(k[0]);
        openRaw = parseFloat(k[1] as string);
        highRaw = parseFloat(k[2] as string);
        lowRaw = parseFloat(k[3] as string);
        closeRaw = parseFloat(k[4] as string);
      } else {
        const k = kline as Record<string, unknown>;
        openTime = Number(k.openTime);
        openRaw = parseFloat(k.open as string);
        highRaw = parseFloat(k.high as string);
        lowRaw = parseFloat(k.low as string);
        closeRaw = parseFloat(k.close as string);
      }

      const timeSec = openTime > 1e10 ? Math.floor(openTime / 1000) : openTime;
      return {
        time: timeSec,
        open: openRaw / scale,
        high: highRaw / scale,
        low: lowRaw / scale,
        close: closeRaw / scale,
      };
    })
    .filter((d) => d.time > 0 && d.open > 0);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChartProps {
  market: MarketInfo | null;
  interval: Interval;
  onIntervalChange: (interval: Interval) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Chart({ market, interval, onIntervalChange }: ChartProps) {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");

  const symbol = market ? toSymbol(market) : "";

  const startTime = useMemo(() => {
    const now = Date.now();
    const durations: Record<Interval, number> = {
      "1m": 24 * 60 * 60 * 1000,
      "5m": 24 * 60 * 60 * 1000,
      "30m": 7 * 24 * 60 * 60 * 1000,
      "1h": 30 * 24 * 60 * 60 * 1000,
      "1d": 90 * 24 * 60 * 60 * 1000,
    };
    return now - durations[interval];
  }, [interval]);

  const { data: klineData, isLoading } = useKline(
    { symbol, interval, startTime, limit: 5000 },
    { enabled: !!symbol }
  );

  const chartData = useMemo(() => {
    if (!klineData || klineData.length === 0) return [];
    return transformKline(klineData as unknown[], market?.quoteDecimals ?? 6);
  }, [klineData, market?.quoteDecimals]);

  if (!market) return null;

  if (isLoading && chartData.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonChart />
      </View>
    );
  }

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

        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              chartType === "candle" && styles.typeButtonActive,
            ]}
            onPress={() => setChartType("candle")}
          >
            <Text
              style={[styles.typeText, chartType === "candle" && styles.typeTextActive]}
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
              style={[styles.typeText, chartType === "line" && styles.typeTextActive]}
            >
              ∿
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <TradingViewChart
          data={chartData}
          chartType={chartType}
          symbol={`${market.baseAsset}/${market.quoteAsset}`}
          onError={(err) =>
            console.warn("[Chart] TradingView error:", err.message)
          }
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  skeletonContainer: {
    flex: 1,
    minHeight: 280,
  },
  skeletonTopBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  intervalText: { fontSize: 11, fontWeight: "500", color: "#888888" },
  intervalTextActive: { color: "#FFFFFF" },
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
  typeButtonActive: { backgroundColor: "rgba(240,103,24,0.2)" },
  typeText: { fontSize: 14, color: "#888888" },
  typeTextActive: { color: "#F06718" },
  chartContainer: {
    flex: 1,
    minHeight: 260,
  },
});
