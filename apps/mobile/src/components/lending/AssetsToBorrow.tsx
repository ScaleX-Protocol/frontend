import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { router } from "expo-router";
import TokenIcon from "../shared/TokenIcon";
import SortIcon from "~/assets/icon/ic_sort.svg";
import type { AvailableToBorrow } from "@scalex/types";

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

// Skeleton asset card — mirrors the real card layout
function SkeletonAssetCard() {
  return (
    <View style={styles.assetCard}>
      {/* Header row: icon+name on left, apy on right */}
      <View style={styles.assetHeader}>
        <View style={styles.assetLeft}>
          <SkeletonBlock width={44} height={44} borderRadius={22} />
          <View style={{ gap: 6 }}>
            <SkeletonBlock width={60} height={14} />
            <SkeletonBlock width={40} height={12} />
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <SkeletonBlock width={50} height={14} />
          <SkeletonBlock width={24} height={11} />
        </View>
      </View>
      {/* Liquidity row */}
      <SkeletonBlock width="100%" height={38} borderRadius={12} style={{ marginBottom: 16 }} />
      {/* Borrow button row */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <SkeletonBlock width="85%" height={38} borderRadius={12} />
        <SkeletonBlock width={36} height={36} borderRadius={12} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function formatLiquidity(value: string) {
  const num = parseFloat(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AssetsToBorrowProps {
  availableToBorrow: AvailableToBorrow[];
  isLoading: boolean;
  error?: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssetsToBorrow({
  availableToBorrow,
  isLoading,
  error,
}: AssetsToBorrowProps) {
  if (isLoading) {
    return (
      <View>
        <View style={styles.sortContainer}>
          <SkeletonBlock width={100} height={14} borderRadius={6} />
        </View>
        <View style={styles.assetList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonAssetCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyTitle}>Error Loading Assets</Text>
        <Text style={styles.emptyDescription}>{error.message}</Text>
      </View>
    );
  }

  if (availableToBorrow.length === 0) {
    return (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyTitle}>No Assets Available</Text>
        <Text style={styles.emptyDescription}>
          There are no assets available to borrow at the moment.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Sort By */}
      <View style={styles.sortContainer}>
        <SortIcon width={16} height={16} />
        <Text style={styles.sortText}>Sort by APY</Text>
      </View>

      {/* Asset List */}
      <View style={styles.assetList}>
        {availableToBorrow.map((asset) => (
          <View key={asset.assetAddress} style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={styles.assetLeft}>
                <TokenIcon symbol={asset.asset} size="lg" />
                <View>
                  <Text style={styles.assetName}>{asset.asset}</Text>
                  <Text style={styles.assetSubtitle}>{asset.asset}</Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                <Text style={styles.assetApy}>
                  {parseFloat(asset.apy).toFixed(2)}%
                </Text>
                <Text style={styles.assetApyLabel}>APY</Text>
              </View>
            </View>

            <View style={styles.assetDetails}>
              <Text style={styles.liquidityLabel}>Liquidity</Text>
              <Text style={styles.liquidityValue}>
                {formatLiquidity(asset.availableLiquidity)}
              </Text>
            </View>

            <View style={styles.borrowButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.borrowButton,
                  !asset.canBorrow && styles.borrowButtonDisabled,
                ]}
                onPress={() => router.push("/borrow" as any)}
                disabled={!asset.canBorrow}
              >
                <Text style={styles.borrowButtonText}>Borrow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoButton}>
                <Text style={styles.infoButtonText}>ⓘ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 12,
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: "#888888",
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assetRight: {
    alignItems: "flex-end",
  },
  assetName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  assetSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  assetApy: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#E26B1D",
  },
  assetApyLabel: {
    fontSize: 10,
    lineHeight: 15,
    color: "#555555",
  },
  assetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  liquidityLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  liquidityValue: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  borrowButtonContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  borrowButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowButtonDisabled: {
    backgroundColor: "#3A3A3A",
    opacity: 0.5,
  },
  borrowButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#000000",
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  infoButtonText: {
    fontSize: 18,
    color: "#888888",
  },
  emptyStateCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F1F1F",
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
  },
});
