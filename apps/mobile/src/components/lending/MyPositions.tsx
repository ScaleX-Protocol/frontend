import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import LightningIcon from "~/assets/icon/ic_lightning.svg";
import UnlockLiquidityIcon from "~/assets/icon/ic_unlock_liquidity.svg";
import EarnIcon from "~/assets/icon/ic_earn.svg";
import type { LendingBorrow, LendingSupply } from "@scalex/types";

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

// Skeleton position card — mirrors real position card
function SkeletonPositionCard() {
  return (
    <View style={styles.positionCard}>
      {/* Header: asset name + badge */}
      <View style={styles.positionHeader}>
        <SkeletonBlock width={60} height={18} borderRadius={6} />
        <SkeletonBlock width={56} height={22} borderRadius={12} />
      </View>
      {/* Three data rows */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.positionRow}>
          <SkeletonBlock width={70} height={13} />
          <SkeletonBlock width={80} height={13} />
        </View>
      ))}
      {/* Action button */}
      <SkeletonBlock width="100%" height={44} borderRadius={24} style={{ marginTop: 8 }} />
    </View>
  );
}

function SkeletonSection({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.positionList}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPositionCard key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MyPositionsProps {
  borrows: LendingBorrow[];
  supplies: LendingSupply[];
  isLoading: boolean;
  error?: Error | null;
  onSwitchToBorrow: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MyPositions({
  borrows,
  supplies,
  isLoading,
  error,
  onSwitchToBorrow,
}: MyPositionsProps) {
  if (error) {
    return (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyTitle}>Error Loading Positions</Text>
        <Text style={styles.emptyDescription}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View>
      {/* ── Borrowed Assets ── */}
      <Text style={styles.sectionTitle}>Borrowed Assets</Text>
      {isLoading ? (
        <SkeletonSection count={2} />
      ) : borrows.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconContainer}>
            <UnlockLiquidityIcon width={28} height={28} />
          </View>
          <Text style={styles.emptyTitle}>Unlock Instant Liquidity</Text>
          <Text style={styles.emptyDescription}>
            Access capital without selling your crypto.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={onSwitchToBorrow}>
            <LightningIcon width={16} height={16} />
            <Text style={styles.ctaButtonText}>Borrow Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.positionList}>
          {borrows.map((borrow) => {
            const assetSymbol = borrow.asset.replace("sx", "");
            const healthColor =
              borrow.healthStatus === "safe"
                ? "#2ECC71"
                : borrow.healthStatus === "warning"
                  ? "#F39C12"
                  : "#E74C3C";

            return (
              <View key={borrow.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionAsset}>{assetSymbol}</Text>
                  <View
                    style={[
                      styles.healthBadge,
                      { backgroundColor: `${healthColor}20` },
                    ]}
                  >
                    <Text
                      style={[styles.healthBadgeText, { color: healthColor }]}
                    >
                      {borrow.healthStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Borrowed</Text>
                  <Text style={styles.positionValue}>
                    ${parseFloat(borrow.currentDebt).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>APY</Text>
                  <Text style={styles.positionValue}>
                    {parseFloat(borrow.apy).toFixed(2)}%
                  </Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Health Factor</Text>
                  <Text
                    style={[styles.positionValue, { color: healthColor }]}
                  >
                    {parseFloat(borrow.healthFactor).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.repayButton}>
                  <Text style={styles.repayButtonText}>Repay</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Earning Assets ── */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Earning Assets</Text>
      {isLoading ? (
        <SkeletonSection count={2} />
      ) : supplies.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconContainer}>
            <EarnIcon width={24} height={24} />
          </View>
          <Text style={styles.emptyTitle}>Ready to Earn?</Text>
          <Text style={styles.emptyDescription}>
            Your idle assets could be growing.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <LightningIcon width={16} height={16} />
            <Text style={styles.ctaButtonText}>Start Earning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.positionList}>
          {supplies.map((supply) => {
            const assetSymbol = supply.asset.replace("sx", "");
            return (
              <View key={supply.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionAsset}>{assetSymbol}</Text>
                  <View
                    style={[
                      styles.healthBadge,
                      { backgroundColor: "#2ECC7120" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.healthBadgeText,
                        { color: "#2ECC71" },
                      ]}
                    >
                      EARNING
                    </Text>
                  </View>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Supplied</Text>
                  <Text style={styles.positionValue}>
                    ${parseFloat(supply.currentValue).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>APY</Text>
                  <Text style={styles.positionValue}>
                    {parseFloat(supply.apy).toFixed(2)}%
                  </Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Earnings</Text>
                  <Text
                    style={[styles.positionValue, { color: "#2ECC71" }]}
                  >
                    +${parseFloat(supply.earnings).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.withdrawButton}>
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.35,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  positionList: {
    gap: 12,
  },
  positionCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  positionAsset: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  positionLabel: {
    fontSize: 14,
    color: "#888888",
  },
  positionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  repayButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 8,
  },
  repayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  withdrawButton: {
    backgroundColor: "#2ECC71",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyStateCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F1F1F",
    marginBottom: 8,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222222",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    lineHeight: 20,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F06718",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    width: "100%",
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
