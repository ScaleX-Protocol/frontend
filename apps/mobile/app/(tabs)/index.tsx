import "../../polyfills";

import * as React from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { useLendingDashboard } from '@scalex/api';
import { useWalletState } from "~/src/hooks/useWalletState";
import { ChainConfig } from "~/src/config/index";

import { AppHeader } from "~/src/components/shared/AppHeader";
import { BalanceCard } from "~/src/components/overview/BalanceCard";
import { MarketOverview } from "~/src/components/overview/MarketOverview";
import { AssetSectionCard } from "~/src/components/overview/AssetSectionCard";

export default function HomeScreen() {
  const { address } = useWalletState();

  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useLendingDashboard(address, ChainConfig.defaultChainId);


  const loading = isLoading || isFetching;

  const balance = dashboardData?.summary
    ? `$${parseFloat(dashboardData.summary.totalSupplied).toLocaleString()}`
    : "-";

  const netAPY = dashboardData?.summary?.netAPY?.toString() || "0.00";
  const healthFactor = dashboardData?.summary?.healthFactor
    ? dashboardData.summary.healthFactor === "Infinity"
      ? "∞"
      : dashboardData.summary.healthFactor.toString()
    : "∞";
  const totalSupplied = dashboardData?.summary?.totalSupplied?.toString() || "0.00";
  const totalBorrowed = dashboardData?.summary?.totalBorrowed?.toString() || "0.00";

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.error("[Home] refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={styles.container}>
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
        <BalanceCard
          balance={balance}
          isLoading={loading}
          error={error}
        />

        <MarketOverview
          netAPY={netAPY}
          healthFactor={healthFactor}
          totalSupplied={totalSupplied}
          totalBorrowed={totalBorrowed}
          isLoading={loading}
          error={error}
        />

        <AssetSectionCard
          variant="portfolio"
          supplies={dashboardData?.supplies}
          isLoading={loading}
          error={error}
        />

        <AssetSectionCard
          variant="earning"
          supplies={dashboardData?.supplies}
          isLoading={loading}
          error={error}
        />

        <AssetSectionCard
          variant="borrow"
          borrows={dashboardData?.borrows}
          isLoading={loading}
          error={error}
        />
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
});
