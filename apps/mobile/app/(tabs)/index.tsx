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
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { router } from "expo-router";
import { AppHeader } from "../../components/AppHeader";
import DepositIcon from "../../assets/icon/ic_deposit.svg";
import WithdrawIcon from "../../assets/icon/ic_withdraw.svg";
import MarketIcon from "../../assets/icon/ic_market.svg";
import PortfolioIcon from "../../assets/icon/ic_portfolio.svg";
import EarnIcon from "../../assets/icon/ic_earn2.svg";
import LiquidityIcon from "../../assets/icon/ic_liquidity.svg";
import { useLendingDashboard } from "~/src/hooks/lending/useLendingDashboard";
import {
  SkeletonBalanceCard,
  SkeletonLendingSummary,
  SkeletonAssetsTable,
} from "../../components/ui/skeleton-loader";
import { PortfolioAssetsTable } from "../../components/tables/PortfolioAssetsTable";
import { EarningAssetsTable } from "../../components/tables/EarningAssetsTable";
import { BorrowAssetsTable } from "../../components/tables/BorrowAssetsTable";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import { ChainConfig } from "../../../../packages/@scalex/service-wallet/src/configs/chain";

export default function HomeScreen() {
  // Use centralized wallet hook instead of scattered useState
  const { walletAddress } = useWalletMobile();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch lending dashboard data using walletAddress from state
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

  // Debug: Log when walletAddress state changes
  React.useEffect(() => {
    console.log("[Home] walletAddress state changed:", walletAddress);
  }, [walletAddress]);

  // Debug: Log when wallet or dashboard data changes
  React.useEffect(() => {
    console.log("[Home] Dashboard hook enabled:", !!walletAddress);
    if (walletAddress) {
      console.log("[Home] Fetching dashboard for:", walletAddress);
      console.log("[Home] Dashboard state:", {
        isLoading: isDashboardLoading,
        hasData: !!dashboardData,
        error: dashboardError,
      });
    }
  }, [walletAddress, isDashboardLoading, dashboardData, dashboardError]);

  // Debug: Log full dashboard data when it changes
  React.useEffect(() => {
    if (dashboardData) {
      console.log("=== LENDING DASHBOARD DATA ===");
      console.log("Summary:", JSON.stringify(dashboardData.summary, null, 2));
      console.log(
        "Supplies (Earning Assets):",
        JSON.stringify(dashboardData.supplies, null, 2),
      );
      console.log(
        "Borrows (Borrowed Assets):",
        JSON.stringify(dashboardData.borrows, null, 2),
      );
      console.log(
        "Available to Supply:",
        JSON.stringify(dashboardData.availableToSupply, null, 2),
      );
      console.log(
        "Available to Borrow:",
        JSON.stringify(dashboardData.availableToBorrow, null, 2),
      );
      console.log(
        "Activity History:",
        JSON.stringify(dashboardData.activityHistory, null, 2),
      );
      console.log("===============================");
    }
  }, [dashboardData]);

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
  const balance = dashboardData?.summary
    ? `$${parseFloat(dashboardData.summary.totalSupplied).toLocaleString()}`
    : '-';

  // Show skeleton during initial load OR when refetching (pull-to-refresh)
  const isLoading =
    isDashboardLoading ||
    isDashboardFetching;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDashboard()]);
    } catch (error) {
      console.error("[Home] Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDashboard]);

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E26B1D"
            colors={["#E26B1D"]}
          />
        }
      >
        {/* Balance Card */}
        {isLoading ? (
          <SkeletonBalanceCard />
        ) : (
          <View style={styles.balanceCard}>
            <View style={styles.balanceBackground}>
              {/* Gradient Background Effect */}
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

              {/* Action Buttons inside card */}
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
        )}

        {/* Market Overview */}
        {isLoading ? (
          <SkeletonLendingSummary />
        ) : (
          <View style={styles.overviewCard}>
            <View style={styles.overviewCardHeader}>
              <MarketIcon width={16} height={16} />
              <Text style={styles.cardTitle}>Market Overview</Text>
            </View>
            <View style={styles.overviewCardBody}>
              <View style={[styles.overviewRow, styles.overviewRowWithBorder]}>
                <Text style={styles.overviewLabel}>Net APY</Text>
                <View style={styles.apyValueContainer}>
                  <Text style={styles.apyArrowIcon}>↗</Text>
                  <Text style={styles.overviewValuePositive}>
                    {parseFloat(netAPY).toFixed(2)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.overviewRow, styles.overviewRowWithBorder]}>
                <Text style={styles.overviewLabel}>Health Factor</Text>
                <Text
                  style={[
                    styles.overviewInfinity,
                    parseFloat(healthFactor) < 1.5 &&
                    parseFloat(healthFactor) > 0
                      ? styles.overviewValueNegative
                      : {},
                  ]}
                >
                  {healthFactor === "∞"
                    ? "∞"
                    : parseFloat(healthFactor).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.overviewRow, styles.overviewRowWithBorder]}>
                <Text style={styles.overviewLabel}>Total Supplied</Text>
                <Text style={styles.overviewValue}>
                  ${parseFloat(totalSupplied).toFixed(2)}
                </Text>
              </View>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Total Borrowed</Text>
                <Text style={styles.overviewValue}>
                  ${parseFloat(totalBorrowed).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Portfolio Assets */}
        {isLoading ? (
          <SkeletonAssetsTable />
        ) : dashboardData?.supplies && dashboardData.supplies.length > 0 ? (
          <View style={styles.assetsCard}>
            <View style={styles.assetsCardHeader}>
              <Text style={styles.assetsCardTitle}>Portfolio Assets</Text>
            </View>
            <PortfolioAssetsTable data={dashboardData.supplies} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardCenter}>
              <View style={styles.iconContainer}>
                <PortfolioIcon width={24} height={24} />
              </View>
              <Text style={styles.cardTitleLarge}>Start Your Portfolio</Text>
              <Text style={styles.cardDescription}>
                Build your crypto wealth securely. Deposit assets to track
                performance.
              </Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Add Assets</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Earning Assets */}
        {isLoading ? (
          <SkeletonAssetsTable />
        ) : dashboardData?.supplies && dashboardData.supplies.length > 0 ? (
          <View style={styles.assetsCard}>
            <View style={styles.assetsCardHeader}>
              <Text style={styles.assetsCardTitle}>Earning Assets</Text>
            </View>
            <EarningAssetsTable data={dashboardData.supplies} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardCenter}>
              <View style={styles.iconContainer}>
                <EarnIcon width={24} height={24} />
              </View>
              <Text style={styles.cardTitleLarge}>Ready to Earn?</Text>
              <Text style={styles.cardDescription}>
                Supply assets to lending pools and start earning passive APY
                today.
              </Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Start Earning</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Borrow Assets */}
        {isLoading ? (
          <SkeletonAssetsTable />
        ) : dashboardData?.borrows && dashboardData.borrows.length > 0 ? (
          <View style={styles.assetsCard}>
            <View style={styles.assetsCardHeader}>
              <Text style={styles.assetsCardTitle}>Borrow Assets</Text>
            </View>
            <BorrowAssetsTable data={dashboardData.borrows} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardCenter}>
              <View style={styles.iconContainer}>
                <LiquidityIcon width={24} height={24} />
              </View>
              <Text style={styles.cardTitleLarge}>Unlock Liquidity</Text>
              <Text style={styles.cardDescription}>
                Get instant liquidity against your collateral without selling your
                assets.
              </Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Borrow Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 16,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  balanceBackground: {
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
  refreshIcon: {
    fontSize: 18,
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
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  cardHeaderWithBorder: {
    paddingBottom: 20,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  marketIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#1A1A1A",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  overviewCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  overviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  overviewCardBody: {
    padding: 8,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  overviewRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  apyValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  apyArrowIcon: {
    fontSize: 14,
    color: "#2ECC71",
  },
  overviewLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#888888",
  },
  overviewValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  overviewValuePositive: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#2ECC71",
  },
  overviewInfinity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ECC71",
  },
  overviewValueNegative: {
    color: "#E74C3C",
  },
  cardCenter: {
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
  cardTitleLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  cardDescription: {
    width: 240,
    paddingInline: 7,
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  cardButton: {
    width: "100%",
    backgroundColor: "#161616",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
  },
  cardButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  assetsCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  assetsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  assetsCardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
