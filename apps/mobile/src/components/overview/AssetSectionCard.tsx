import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { PortfolioAssetsTable } from "../../components/tables/PortfolioAssetsTable";
import { EarningAssetsTable } from "../../components/tables/EarningAssetsTable";
import { BorrowAssetsTable } from "../../components/tables/BorrowAssetsTable";
import PortfolioIcon from "~/assets/icon/ic_portfolio.svg";
import EarnIcon from "~/assets/icon/ic_earn2.svg";
import LiquidityIcon from "~/assets/icon/ic_liquidity.svg";
import type { LendingSupply, LendingBorrow } from "@scalex/types";

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

// Table skeleton: header row + N data rows, exactly mirrors the real table
function SkeletonAssetsTable({ rows = 3 }: { rows?: number }) {
  return (
    <View>
      {/* Header row */}
      <View style={skeletonStyles.headerRow}>
        <SkeletonBlock width={50} height={11} style={{ marginRight: "auto" }} />
        <SkeletonBlock width={50} height={11} style={{ marginHorizontal: 8 }} />
        <SkeletonBlock width={40} height={11} style={{ marginLeft: "auto" }} />
      </View>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={skeletonStyles.dataRow}>
          {/* Asset icon + label */}
          <View style={skeletonStyles.assetCell}>
            <SkeletonBlock width={28} height={28} borderRadius={14} />
            <SkeletonBlock width={48} height={12} borderRadius={5} />
          </View>
          {/* Middle value */}
          <View style={skeletonStyles.midCell}>
            <SkeletonBlock width={70} height={12} borderRadius={5} />
          </View>
          {/* Right value */}
          <View style={skeletonStyles.rightCell}>
            <SkeletonBlock width={40} height={12} borderRadius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#11111180",
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  assetCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  midCell: {
    flex: 1,
    alignItems: "center",
  },
  rightCell: {
    flex: 1,
    alignItems: "flex-end",
  },
});

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

type Variant = "portfolio" | "earning" | "borrow";

const VARIANT_CONFIG = {
  portfolio: {
    title: "Portfolio Assets",
    emptyTitle: "Start Your Portfolio",
    emptyDescription:
      "Build your crypto wealth securely. Deposit assets to track performance.",
    emptyButtonLabel: "Add Assets",
    Icon: PortfolioIcon,
  },
  earning: {
    title: "Earning Assets",
    emptyTitle: "Ready to Earn?",
    emptyDescription:
      "Supply assets to lending pools and start earning passive APY today.",
    emptyButtonLabel: "Start Earning",
    Icon: EarnIcon,
  },
  borrow: {
    title: "Borrow Assets",
    emptyTitle: "Unlock Liquidity",
    emptyDescription:
      "Get instant liquidity against your collateral without selling your assets.",
    emptyButtonLabel: "Borrow Now",
    Icon: LiquidityIcon,
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AssetSectionCardProps {
  variant: Variant;
  supplies?: LendingSupply[];
  borrows?: LendingBorrow[];
  isLoading: boolean;
  error?: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssetSectionCard({
  variant,
  supplies,
  borrows,
  isLoading,
  error,
}: AssetSectionCardProps) {
  const config = VARIANT_CONFIG[variant];
  const { Icon } = config;

  // Choose the data based on variant
  const hasData =
    variant === "borrow"
      ? borrows && borrows.length > 0
      : supplies && supplies.length > 0;

  if (isLoading) {
    return (
      <View style={styles.card}>
        {/* Card header skeleton */}
        <View style={styles.cardHeader}>
          <SkeletonBlock width={120} height={14} borderRadius={6} />
        </View>
        <SkeletonAssetsTable rows={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{config.title}</Text>
        </View>
        <View style={styles.errorBody}>
          <Text style={styles.errorText}>Failed to load data</Text>
          <Text style={styles.errorSubText}>{error.message}</Text>
        </View>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyBody}>
          <View style={styles.iconContainer}>
            <Icon width={24} height={24} />
          </View>
          <Text style={styles.emptyTitle}>{config.emptyTitle}</Text>
          <Text style={styles.emptyDescription}>{config.emptyDescription}</Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>{config.emptyButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{config.title}</Text>
      </View>
      {variant === "portfolio" && supplies && (
        <PortfolioAssetsTable data={supplies} />
      )}
      {variant === "earning" && supplies && (
        <EarningAssetsTable data={supplies} />
      )}
      {variant === "borrow" && borrows && (
        <BorrowAssetsTable data={borrows} />
      )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  emptyBody: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyDescription: {
    width: 240,
    paddingHorizontal: 7,
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    width: "100%",
    backgroundColor: "#161616",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
  },
  emptyButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorBody: {
    padding: 16,
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
