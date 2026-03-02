import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { router } from "expo-router";
import DepositIcon from "~/assets/icon/ic_deposit.svg";
import WithdrawIcon from "~/assets/icon/ic_withdraw.svg";

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
  borderRadius = 8,
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
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#2A2A2A",
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton that mirrors the exact card layout
function SkeletonBalanceCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardBackground}>
        {/* label */}
        <SkeletonBlock width={100} height={14} borderRadius={6} style={{ marginBottom: 16 }} />
        {/* big balance number */}
        <SkeletonBlock width={200} height={44} borderRadius={10} style={{ marginBottom: 6 }} />
        {/* USD label */}
        <SkeletonBlock width={60} height={16} borderRadius={6} style={{ marginBottom: 28 }} />
        {/* deposit / withdraw buttons row */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <SkeletonBlock width="50%" height={44} borderRadius={99} />
          <SkeletonBlock width="50%" height={44} borderRadius={99} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BalanceCardProps {
  balance: string;
  isLoading: boolean;
  error?: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BalanceCard({ balance, isLoading, error }: BalanceCardProps) {
  if (isLoading) return <SkeletonBalanceCard />;

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.cardBackground}>
          <Text style={styles.errorText}>Failed to load balance</Text>
          <Text style={styles.errorSubText}>{error.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardBackground}>
        {/* Gradient background effect */}
        <Svg
          width="300"
          height="300"
          style={{ position: "absolute", top: -150, right: -150 }}
        >
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="#E26B1D" stopOpacity="0.15" />
              <Stop offset="50%" stopColor="#E26B1D" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#E26B1D" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#grad)" />
        </Svg>

        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          {balance} <Text style={styles.balanceUSD}>USD</Text>
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => router.push("/deposit")}
          >
            <DepositIcon width={16} height={16} />
            <Text style={styles.depositButtonText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => router.push("/withdraw")}
          >
            <WithdrawIcon width={16} height={16} />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
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
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  cardBackground: {
    padding: 24,
    position: "relative",
  },
  balanceHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#888888",
  },
  balanceAmount: {
    fontSize: 48,
    lineHeight: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 18,
    lineHeight: 28,
    color: "#555555",
    fontWeight: "400",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  depositButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F06718",
    paddingVertical: 12,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(246, 164, 116, 0.64)",
  },
  depositButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  withdrawButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
    marginBottom: 4,
  },
  errorSubText: {
    fontSize: 12,
    color: "#666666",
  },
});
