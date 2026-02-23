import "../../polyfills";

import * as React from "react";
import { ScrollView, RefreshControl, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMarkets } from '@scalex/api';
import type { Market } from "@scalex/types";

import { AppHeader } from "~/src/components/shared/AppHeader";
import { MarketHeader } from "~/src/components/trade/MarketHeader";
import Chart, { type Interval } from "~/src/components/trade/Chart";
import PlaceOrder from "~/src/components/trade/PlaceOrder";
import History from "~/src/components/trade/History";
import type { MarketInfo } from "~/src/components/trade/types";

export default function TradeScreen() {
  const [selectedMarket, setSelectedMarket] = React.useState<MarketInfo | null>(null);
  const [interval, setInterval] = React.useState<Interval>("5m");
  const [favoriteMarkets, setFavoriteMarkets] = React.useState<string[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: markets,
    isLoading: marketsLoading,
    refetch: refetchMarkets,
  } = useMarkets();

  console.log(markets);

  // Auto-select highest-volume market on first load
  React.useEffect(() => {
    if (markets && markets.length > 0 && !selectedMarket) {
      const top = [...markets].sort(
        (a, b) => parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
      )[0];
      setSelectedMarket({
        poolId: top.poolId,
        baseAsset: top.baseAsset,
        quoteAsset: top.quoteAsset,
        baseDecimals: top.baseDecimals,
        quoteDecimals: top.quoteDecimals,
      });
    }
  }, [markets, selectedMarket]);

  const handleSelectMarket = React.useCallback((market: Market) => {
    setSelectedMarket({
      poolId: market.poolId,
      baseAsset: market.baseAsset,
      quoteAsset: market.quoteAsset,
      baseDecimals: market.baseDecimals,
      quoteDecimals: market.quoteDecimals,
    });
  }, []);

  const handleToggleFavorite = React.useCallback((poolId: string) => {
    setFavoriteMarkets((prev) =>
      prev.includes(poolId) ? prev.filter((id) => id !== poolId) : [...prev, poolId]
    );
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchMarkets();
    } catch (e) {
      console.error("[Trade] refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMarkets]);

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
        <MarketHeader
          market={selectedMarket}
          markets={markets ?? []}
          isLoading={marketsLoading && !markets}
          favoriteMarkets={favoriteMarkets}
          onSelectMarket={handleSelectMarket}
          onToggleFavorite={handleToggleFavorite}
        />

        {selectedMarket ? (
          <>
            <Chart
              market={selectedMarket}
              interval={interval}
              onIntervalChange={setInterval}
            />

            <PlaceOrder market={selectedMarket} />

            <History market={selectedMarket} />
          </>
        ) : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#E26B1D" />
            <Text style={styles.loadingText}>Loading market data…</Text>
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
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#666666",
  },
});
