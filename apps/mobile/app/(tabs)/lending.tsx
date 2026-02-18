import "../../polyfills";

import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import { AppHeader } from "../../components/AppHeader";
import LightningIcon from "../../assets/icon/ic_lightning.svg";
import UnlockLiquidityIcon from "../../assets/icon/ic_unlock_liquidity.svg";
import EarnIcon from "../../assets/icon/ic_earn.svg";
import SortIcon from "../../assets/icon/ic_sort.svg";
import {
  SkeletonLendingSummary,
  SkeletonList,
} from "../../components/ui/skeleton-loader";
import { useLendingDashboard } from "~/src/hooks/lending/useLendingDashboard";
import { ChainConfig } from "../../../../packages/@scalex/service-wallet/src/configs/chain";
import CountUp from "../../src/components/shared/CountUp";
import ProgressBar from "../../src/components/shared/ProgressBar";
import {
  formatCompactValue,
} from "../../src/utils/formatting";
import TokenIcon from "~/components/TokenIcon";

function LendingScreenContent() {
  const [activeTab, setActiveTab] = React.useState<"borrow" | "positions">(
    "borrow",
  );
  const [refreshing, setRefreshing] = React.useState(false);

  // Use centralized wallet hook
  const { walletAddress } = useWalletMobile();

  // Fetch lending dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    refetch: refetchDashboard,
    error: dashboardError,
  } = useLendingDashboard(
    { user: walletAddress || "", chainId: ChainConfig.defaultChainId },
    { enabled: !!walletAddress },
  );

  // Show skeleton during initial load OR when refetching (pull-to-refresh)
  const isLoading = isDashboardLoading || isDashboardFetching || refreshing;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.error("[Lending] Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDashboard]);

  // Extract lending data with fallbacks
  const netAPY = dashboardData?.summary?.netAPY?.toString() || "0.00";
  const healthFactor = dashboardData?.summary?.healthFactor
    ? dashboardData.summary.healthFactor === "Infinity"
      ? "∞"
      : dashboardData.summary.healthFactor.toString()
    : "∞";
  const totalSupplied =
    dashboardData?.summary?.totalSupplied?.toString() || "0.00";
  const totalBorrowed =
    dashboardData?.summary?.totalBorrowed?.toString() || "0.00";
  const borrowingPower =
    dashboardData?.summary?.borrowingPower?.toString() || "0.00";

  // Extract positions data
  const availableToBorrow = dashboardData?.availableToBorrow || [];
  const borrowedAssets = dashboardData?.borrows || [];
  const earningAssets = dashboardData?.supplies || [];

  // Calculate borrowing power usage percentage
  const borrowingPowerUsagePercent = React.useMemo(() => {
    const supplied = parseFloat(totalSupplied);
    const borrowed = parseFloat(totalBorrowed);
    if (supplied === 0) return 0;
    return Math.min((borrowed / supplied) * 100, 100);
  }, [totalSupplied, totalBorrowed]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Fixed Header */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E26B1D"
            colors={["#E26B1D"]}
          />
        }
      >
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {isLoading ? (
            <SkeletonLendingSummary />
          ) : (
            <View style={styles.summaryCard}>
              {/* Net APY Row */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Net APY</Text>
                <View style={styles.summaryValueWithIcon}>
                  {/* TODO: Add StatIcon here when user provides it */}
                  <CountUp
                    end={parseFloat(netAPY)}
                    decimals={2}
                    suffix="%"
                    style={styles.summaryValueGreen}
                  />
                </View>
              </View>

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Health Factor Row */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Health Factor</Text>
                <View style={styles.summaryValueWithIcon}>
                  {/* TODO: Add ShieldCheck icon here when user provides it */}
                  {healthFactor === "∞" ? (
                    <Text style={[styles.summaryValueGreen]}>∞</Text>
                  ) : (
                    <CountUp
                      end={parseFloat(healthFactor)}
                      decimals={2}
                      style={
                        parseFloat(healthFactor) < 1.5 &&
                        parseFloat(healthFactor) > 0
                          ? styles.summaryValueRed
                          : styles.summaryValueGreen
                      }
                    />
                  )}
                </View>
              </View>

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Borrowing Power Row with Progress Bar */}
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

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Total Supplied and Borrowed */}
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Supplied</Text>
                  <Text style={styles.totalValue}>
                    {formatCompactValue(totalSupplied)}
                  </Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Borrowed</Text>
                  <Text style={styles.totalValue}>
                    {formatCompactValue(totalBorrowed)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "borrow" && styles.tabActive]}
            onPress={() => {
              setActiveTab("borrow");
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "borrow" && styles.tabTextActive,
              ]}
            >
              Assets to Borrow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "positions" && styles.tabActive]}
            onPress={() => {
              setActiveTab("positions");
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "positions" && styles.tabTextActive,
              ]}
            >
              My Positions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "positions" ? (
          <View style={styles.tabContent}>
            {/* Borrowed Assets */}
            <Text style={styles.sectionTitle}>Borrowed Assets</Text>
            {isLoading ? (
              <SkeletonList count={2} />
            ) : borrowedAssets.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <UnlockLiquidityIcon width={28} height={28} />
                </View>
                <Text style={styles.emptyTitle}>Unlock Instant Liquidity</Text>
                <Text style={styles.emptyDescription}>
                  Access capital without selling your crypto.
                </Text>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => setActiveTab("borrow")}
                >
                  <LightningIcon width={16} height={16} />
                  <Text style={styles.ctaButtonText}>Borrow Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.positionList}>
                {borrowedAssets.map((borrow) => {
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
                            style={[
                              styles.healthBadgeText,
                              { color: healthColor },
                            ]}
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

            {/* Earning Assets */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Earning Assets
            </Text>
            {isLoading ? (
              <SkeletonList count={2} />
            ) : earningAssets.length === 0 ? (
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
                {earningAssets.map((supply) => {
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
        ) : (
          <View style={styles.tabContent}>
            {/* Sort By */}
            <View style={styles.sortContainer}>
              <SortIcon width={16} height={16} />
              <Text style={styles.sortText}>Sort by APY</Text>
            </View>

            {/* Asset List */}
            {isLoading ? (
              <SkeletonList count={5} />
            ) : availableToBorrow.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyTitle}>No Assets Available</Text>
                <Text style={styles.emptyDescription}>
                  There are no assets available to borrow at the moment.
                </Text>
              </View>
            ) : (
              <View style={styles.assetList}>
                {availableToBorrow.map((asset) => {
                  const formatLiquidity = (value: string) => {
                    const num = parseFloat(value);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
                    return num.toFixed(2);
                  };

                  return (
                    <View key={asset.assetAddress} style={styles.assetCard}>
                      <View style={styles.assetHeader}>
                        <View style={styles.assetLeft}>
                          <TokenIcon symbol={asset.asset} size="lg" />
                          <View>
                            <Text style={styles.assetName}>{asset.asset}</Text>
                            <Text style={styles.assetSubtitle}>
                              {asset.asset}
                            </Text>
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
                          disabled={!asset.canBorrow}
                        >
                          <Text style={styles.borrowButtonText}>Borrow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoButton}>
                          <Text style={styles.infoButtonText}>ⓘ</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.35,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
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
  summaryPercentage: {
    fontSize: 14,
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
  borrowingPowerSection: {
    marginBottom: 16,
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
  progressFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
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
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#666666",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabContent: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.35,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  emptyStateCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
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
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  assetIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
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
  assetRight: {
    alignItems: "flex-end",
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
    borderColor: '#333333',
  },
  infoButtonText: {
    fontSize: 18,
    color: "#888888",
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
});

export default function LendingScreen() {
  return <LendingScreenContent />;
}
