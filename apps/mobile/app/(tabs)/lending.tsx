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
import { AppHeader } from "../../components/AppHeader";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import { useLendingDashboard } from "~/src/hooks/lending/useLendingDashboard";
import { ChainConfig } from "../../../../packages/@scalex/service-wallet/src/configs/chain";
import { LendingSummary } from "~/src/components/lending/LendingSummary";
import { AssetsToBorrow } from "~/src/components/lending/AssetsToBorrow";
import { MyPositions } from "~/src/components/lending/MyPositions";

export default function LendingScreen() {
  const [activeTab, setActiveTab] = React.useState<"borrow" | "positions">("borrow");
  const [refreshing, setRefreshing] = React.useState(false);

  const { walletAddress } = useWalletMobile();

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useLendingDashboard(
    { user: walletAddress || "", chainId: ChainConfig.defaultChainId },
    { enabled: !!walletAddress }
  );

  const loading = isLoading || isFetching || refreshing;

  // Extract scalar data with fallbacks
  const netAPY = dashboardData?.summary?.netAPY?.toString() || "0.00";
  const healthFactor = dashboardData?.summary?.healthFactor
    ? dashboardData.summary.healthFactor === "Infinity"
      ? "∞"
      : dashboardData.summary.healthFactor.toString()
    : "∞";
  const totalSupplied = dashboardData?.summary?.totalSupplied?.toString() || "0.00";
  const totalBorrowed = dashboardData?.summary?.totalBorrowed?.toString() || "0.00";
  const borrowingPower = dashboardData?.summary?.borrowingPower?.toString() || "0.00";

  // Borrowing power usage %
  const borrowingPowerUsagePercent = React.useMemo(() => {
    const supplied = parseFloat(totalSupplied);
    const borrowed = parseFloat(totalBorrowed);
    if (supplied === 0) return 0;
    return Math.min((borrowed / supplied) * 100, 100);
  }, [totalSupplied, totalBorrowed]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.error("[Lending] refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
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
        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <LendingSummary
            netAPY={netAPY}
            healthFactor={healthFactor}
            totalSupplied={totalSupplied}
            totalBorrowed={totalBorrowed}
            borrowingPower={borrowingPower}
            borrowingPowerUsagePercent={borrowingPowerUsagePercent}
            isLoading={loading}
            error={error}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "borrow" && styles.tabActive]}
            onPress={() => setActiveTab("borrow")}
          >
            <Text style={[styles.tabText, activeTab === "borrow" && styles.tabTextActive]}>
              Assets to Borrow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "positions" && styles.tabActive]}
            onPress={() => setActiveTab("positions")}
          >
            <Text style={[styles.tabText, activeTab === "positions" && styles.tabTextActive]}>
              My Positions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === "borrow" ? (
            <AssetsToBorrow
              availableToBorrow={dashboardData?.availableToBorrow || []}
              isLoading={loading}
              error={error}
            />
          ) : (
            <MyPositions
              borrows={dashboardData?.borrows || []}
              supplies={dashboardData?.supplies || []}
              isLoading={loading}
              error={error}
              onSwitchToBorrow={() => setActiveTab("borrow")}
            />
          )}
        </View>
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
});
