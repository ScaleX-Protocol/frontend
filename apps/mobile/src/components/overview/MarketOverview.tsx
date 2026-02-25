import * as React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import MarketIcon from "~/assets/icon/ic_market.svg";

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function usePulse() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonBlock({
  width,
  height,
  borderRadius = 6,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#2A2A2A", opacity }, style]}
    />
  );
}

// Skeleton row that mirrors: label on left, value on right
function SkeletonRow({ last = false }: { last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowWithBorder]}>
      <SkeletonBlock width={90} height={13} />
      <SkeletonBlock width={60} height={13} />
    </View>
  );
}

// Full skeleton matching card structure
function SkeletonMarketOverview() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <SkeletonBlock width={16} height={16} borderRadius={4} />
        <SkeletonBlock width={110} height={14} borderRadius={6} />
      </View>
      {/* Rows */}
      <View style={styles.cardBody}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow last />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarketOverviewProps {
  netAPY: string;
  healthFactor: string;
  totalSupplied: string;
  totalBorrowed: string;
  isLoading: boolean;
  error?: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketOverview({
  netAPY,
  healthFactor,
  totalSupplied,
  totalBorrowed,
  isLoading,
  error,
}: MarketOverviewProps) {
  if (isLoading) return <SkeletonMarketOverview />;

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MarketIcon width={16} height={16} />
          <Text style={styles.cardTitle}>Market Overview</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.errorText}>Failed to load market data</Text>
          <Text style={styles.errorSubText}>{error.message}</Text>
        </View>
      </View>
    );
  }

  const hf = parseFloat(healthFactor);
  const isHealthWarning = !isNaN(hf) && hf < 1.5 && hf > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MarketIcon width={16} height={16} />
        <Text style={styles.cardTitle}>Market Overview</Text>
      </View>
      <View style={styles.cardBody}>
        {/* Net APY */}
        <View style={[styles.row, styles.rowWithBorder]}>
          <Text style={styles.label}>Net APY</Text>
          <View style={styles.apyValueContainer}>
            <Text style={styles.apyArrow}>↗</Text>
            <Text style={styles.valuePositive}>
              {parseFloat(netAPY).toFixed(2)}%
            </Text>
          </View>
        </View>
        {/* Health Factor */}
        <View style={[styles.row, styles.rowWithBorder]}>
          <Text style={styles.label}>Health Factor</Text>
          <Text
            style={[
              styles.valueInfinity,
              isHealthWarning && styles.valueNegative,
            ]}
          >
            {healthFactor === "∞"
              ? "∞"
              : parseFloat(healthFactor).toFixed(2)}
          </Text>
        </View>
        {/* Total Supplied */}
        <View style={[styles.row, styles.rowWithBorder]}>
          <Text style={styles.label}>Total Supplied</Text>
          <Text style={styles.value}>
            ${parseFloat(totalSupplied).toFixed(2)}
          </Text>
        </View>
        {/* Total Borrowed */}
        <View style={styles.row}>
          <Text style={styles.label}>Total Borrowed</Text>
          <Text style={styles.value}>
            ${parseFloat(totalBorrowed).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardBody: {
    padding: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  rowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#888888",
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  valuePositive: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#2ECC71",
  },
  valueInfinity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ECC71",
  },
  valueNegative: {
    color: "#E74C3C",
  },
  apyValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  apyArrow: {
    fontSize: 14,
    color: "#2ECC71",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
    marginBottom: 4,
    padding: 12,
  },
  errorSubText: {
    fontSize: 12,
    color: "#666666",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
