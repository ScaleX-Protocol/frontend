import * as React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import CountUp from "~/src/components/shared/CountUp";
import ProgressBar from "~/src/components/shared/ProgressBar";
import { formatCompactValue } from "~/src/utils/formatting";

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

// Full skeleton that mirrors the real summary card layout
function SkeletonLendingSummary() {
  return (
    <View style={styles.summaryCard}>
      {/* Net APY row */}
      <View style={styles.summaryRow}>
        <SkeletonBlock width={60} height={13} />
        <SkeletonBlock width={50} height={13} />
      </View>
      <View style={styles.summaryDivider} />
      {/* Health Factor row */}
      <View style={styles.summaryRow}>
        <SkeletonBlock width={90} height={13} />
        <SkeletonBlock width={40} height={13} />
      </View>
      <View style={styles.summaryDivider} />
      {/* Borrowing Power row */}
      <View style={styles.summaryRow}>
        <SkeletonBlock width={100} height={13} />
        <View style={{ alignItems: "flex-end", gap: 8, width: 80 }}>
          <SkeletonBlock width={70} height={13} />
          {/* progress bar skeleton */}
          <SkeletonBlock width="100%" height={4} borderRadius={2} />
        </View>
      </View>
      <View style={styles.summaryDivider} />
      {/* Totals row */}
      <View style={styles.totalsRow}>
        <View style={styles.totalItem}>
          <SkeletonBlock width={80} height={11} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={60} height={14} />
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <SkeletonBlock width={80} height={11} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LendingSummaryProps {
  netAPY: string;
  healthFactor: string;
  totalSupplied: string;
  totalBorrowed: string;
  borrowingPower: string;
  borrowingPowerUsagePercent: number;
  isLoading: boolean;
  error?: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LendingSummary({
  netAPY,
  healthFactor,
  totalSupplied,
  totalBorrowed,
  borrowingPower,
  borrowingPowerUsagePercent,
  isLoading,
  error,
}: LendingSummaryProps) {
  if (isLoading) return <SkeletonLendingSummary />;

  if (error) {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.errorText}>Failed to load summary</Text>
        </View>
        <Text style={styles.errorSubText}>{error.message}</Text>
      </View>
    );
  }

  const hf = parseFloat(healthFactor);
  const isHealthWarning = !isNaN(hf) && hf < 1.5 && hf > 0;

  return (
    <View style={styles.summaryCard}>
      {/* Net APY */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Net APY</Text>
        <View style={styles.summaryValueWithIcon}>
          <CountUp
            end={parseFloat(netAPY)}
            decimals={2}
            suffix="%"
            style={styles.summaryValueGreen}
          />
        </View>
      </View>

      <View style={styles.summaryDivider} />

      {/* Health Factor */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Health Factor</Text>
        <View style={styles.summaryValueWithIcon}>
          {healthFactor === "∞" ? (
            <Text style={styles.summaryValueGreen}>∞</Text>
          ) : (
            <CountUp
              end={hf}
              decimals={2}
              style={isHealthWarning ? styles.summaryValueRed : styles.summaryValueGreen}
            />
          )}
        </View>
      </View>

      <View style={styles.summaryDivider} />

      {/* Borrowing Power */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Borrowing Power</Text>
        <View style={styles.borrowingPowerContainer}>
          <CountUp
            end={parseFloat(borrowingPower)}
            decimals={2}
            prefix="$"
            separator=","
            style={styles.borrowingPowerValue}
          />
          <ProgressBar
            progress={borrowingPowerUsagePercent}
            height={4}
            backgroundColor="#222222"
            gradientColors={["#E26B1D", "#F07830"]}
            style={styles.progressBar}
          />
        </View>
      </View>

      <View style={styles.summaryDivider} />

      {/* Totals */}
      <View style={styles.totalsRow}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Supplied</Text>
          <Text style={styles.totalValue}>{formatCompactValue(totalSupplied)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Borrowed</Text>
          <Text style={styles.totalValue}>{formatCompactValue(totalBorrowed)}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#161616",
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#888888",
  },
  summaryValueWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryValueGreen: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#2ECC71",
  },
  summaryValueRed: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#E74C3C",
  },
  borrowingPowerContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    width: 80,
  },
  borrowingPowerValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "right",
  },
  progressBar: {
    width: "100%",
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 2,
  },
  totalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#161616",
  },
  totalLabel: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: "#666666",
  },
  totalValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
  },
  errorSubText: {
    fontSize: 12,
    color: "#666666",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
