import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo, useCallback } from "react";
import { AppHeader } from "../../components/AppHeader";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryCandlestick,
} from "victory-native";
import {
  useMarkets,
  useTicker24hr,
  useKline,
  useDepthWithRealtime,
  useTradesWithRealtime,
  useOpenOrders,
} from "~/src/hooks/trading";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import type { Market } from "@scalex/types";
import {
  SkeletonPriceCard,
  SkeletonChart,
  SkeletonOrderBook,
  SkeletonTrades,
} from "../../components/ui/skeleton-loader";

const { width } = Dimensions.get("window");

function TradeScreenContent() {
  // Use centralized wallet hook
  const { walletAddress } = useWalletMobile();

  // State
  const [activeOrderType, setActiveOrderType] = useState<"buy" | "sell">("buy");
  const [orderMode, setOrderMode] = useState<"limit" | "market">("limit");
  const [activeOrdersTab, setActiveOrdersTab] = useState<"open" | "history">(
    "open",
  );
  const [interval, setInterval] = useState<"1m" | "5m" | "30m" | "1h" | "1d">(
    "1h",
  );
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const intervals: Array<"1m" | "5m" | "30m" | "1h" | "1d"> = [
    "1m",
    "5m",
    "30m",
    "1h",
    "1d",
  ];

  // Fetch markets
  const {
    data: markets,
    isLoading: marketsLoading,
    isFetching: marketsFetching,
    refetch: refetchMarkets,
  } = useMarkets();

  // Select default market (highest volume)
  React.useEffect(() => {
    if (markets && markets.length > 0 && !selectedMarket) {
      const topMarket = [...markets].sort(
        (a, b) =>
          parseFloat(b.volumeInQuote || "0") -
          parseFloat(a.volumeInQuote || "0"),
      )[0];
      console.log("[Trade] Setting selectedMarket to:", topMarket.symbol);
      console.log("[Trade] Top market data:", topMarket);
      setSelectedMarket(topMarket.symbol);
    }
  }, [markets, selectedMarket]);

  const currentMarket = useMemo(() => {
    return markets?.find((m) => m.symbol === selectedMarket);
  }, [markets, selectedMarket]);

  // Fetch ticker data for selected market
  React.useEffect(() => {
    if (selectedMarket) {
      console.log("[Trade] Fetching ticker for symbol:", selectedMarket);
      console.log("[Trade] Symbol length:", selectedMarket.length);
      console.log('[Trade] Symbol includes "/":', selectedMarket.includes("/"));
    }
  }, [selectedMarket]);

  const {
    data: ticker,
    isFetching: tickerFetching,
    refetch: refetchTicker,
  } = useTicker24hr(selectedMarket || "", {
    enabled: !!selectedMarket,
    refetchInterval: 5000,
  });

  // Fetch kline data for chart
  const {
    data: klineData,
    isFetching: klineFetching,
    refetch: refetchKline,
  } = useKline(
    { symbol: selectedMarket || "", interval, limit: 100 },
    { enabled: !!selectedMarket },
  );

  // Fetch order book with real-time updates
  const {
    data: orderBook,
    isLoading: orderBookLoading,
    isFetching: orderBookFetching,
  } = useDepthWithRealtime({
    symbol: selectedMarket || "",
    limit: 20,
    enableRealtime: true,
  });

  // Fetch trades with real-time updates
  const {
    data: trades,
    isLoading: tradesLoading,
    isFetching: tradesFetching,
  } = useTradesWithRealtime({
    symbol: selectedMarket || "",
    limit: 50,
    enableRealtime: true,
  });

  // Fetch user's open orders
  const { data: openOrders } = useOpenOrders(
    { address: walletAddress || "", symbol: selectedMarket || "", limit: 50 },
    { enabled: !!walletAddress && !!selectedMarket },
  );

  // Calculate current price
  const currentPrice = useMemo(() => {
    return ticker?.lastPrice || currentMarket?.latestPrice || "0";
  }, [ticker, currentMarket]);

  // Calculate 24h change
  const priceChange = useMemo(() => {
    const change = parseFloat(ticker?.priceChange || "0");
    const changePercent = parseFloat(ticker?.priceChangePercent || "0");
    return {
      value: change,
      percent: changePercent,
      isPositive: change >= 0,
    };
  }, [ticker]);

  // Format chart data for Victory
  const chartData = useMemo(() => {
    if (!klineData || klineData.length === 0) return [];

    return klineData.map((kline, index) => ({
      x: index,
      open: parseFloat(kline.open),
      close: parseFloat(kline.close),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
    }));
  }, [klineData]);

  // Get bids and asks from order book
  const bids = orderBook?.bids?.slice(0, 10) || [];
  const asks = orderBook?.asks?.slice(0, 10) || [];

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMarkets(), refetchTicker(), refetchKline()]);
    setRefreshing(false);
  }, [refetchMarkets, refetchTicker, refetchKline]);

  // Handle market selection
  const handleSelectMarket = (market: Market) => {
    setSelectedMarket(market.symbol);
    setShowMarketSelector(false);
  };

  // Handle order placement
  const handlePlaceOrder = () => {
    // TODO: Implement order placement with Privy
    console.log("Place order:", {
      type: activeOrderType,
      mode: orderMode,
      amount,
      price,
    });
    alert("Order placement will be implemented in Phase 3");
  };

  // Show skeleton during initial load OR when refetching (pull-to-refresh)
  const isLoading = marketsLoading || marketsFetching || tickerFetching;
  const chartLoading = !klineData || klineData.length === 0 || klineFetching;
  const showOrderBookSkeleton = orderBookLoading || orderBookFetching;
  const showTradesSkeleton = tradesLoading || tradesFetching;

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
        {/* Trading Pair Selector */}
        <TouchableOpacity
          style={styles.pairSelector}
          onPress={() => setShowMarketSelector(true)}
        >
          <Text style={styles.pairText}>
            {currentMarket ? currentMarket.symbol : "Select Market"}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        {/* Price Display */}
        {isLoading ? (
          <SkeletonPriceCard />
        ) : (
          <>
            <View style={styles.priceSection}>
              <Text style={styles.currentPrice}>
                ${parseFloat(currentPrice).toFixed(4)}
              </Text>
              <Text
                style={[
                  styles.priceChange,
                  priceChange.isPositive
                    ? styles.priceChangePositive
                    : styles.priceChangeNegative,
                ]}
              >
                {priceChange.isPositive ? "↑" : "↓"}{" "}
                {Math.abs(priceChange.percent).toFixed(2)}%{" "}
                <Text style={styles.priceChangeDetail}>
                  {priceChange.isPositive ? "+" : ""}$
                  {priceChange.value.toFixed(2)} (24h)
                </Text>
              </Text>
            </View>

            {/* Price Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24H HIGH</Text>
                <Text style={styles.statValue}>
                  ${parseFloat(ticker?.highPrice || "0").toFixed(4)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24H LOW</Text>
                <Text style={styles.statValue}>
                  ${parseFloat(ticker?.lowPrice || "0").toFixed(4)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24H VOLUME</Text>
                <Text style={styles.statValue}>
                  $
                  {(parseFloat(ticker?.quoteVolume || "0") / 1000000).toFixed(
                    2,
                  )}
                  M
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Interval Selector */}
        <View style={styles.timePeriodContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {intervals.map((int) => (
              <TouchableOpacity
                key={int}
                style={[
                  styles.timePeriodButton,
                  interval === int && styles.timePeriodActive,
                ]}
                onPress={() => setInterval(int)}
              >
                <Text
                  style={[
                    styles.timePeriodText,
                    interval === int && styles.timePeriodTextActive,
                  ]}
                >
                  {int}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {chartLoading ? (
            <SkeletonChart />
          ) : (
            <VictoryChart
              height={200}
              width={width - 40}
              padding={{ top: 20, bottom: 30, left: 0, right: 0 }}
            >
              <VictoryCandlestick
                data={chartData}
                candleColors={{ positive: "#2ECC71", negative: "#E74C3C" }}
                style={{
                  data: {
                    strokeWidth: 1,
                  },
                }}
              />
              <VictoryAxis
                style={{
                  axis: { stroke: "#333" },
                  tickLabels: { fill: "#666", fontSize: 10 },
                  grid: { stroke: "#222" },
                }}
              />
            </VictoryChart>
          )}
        </View>

        {/* Buy/Sell Toggle */}
        <View style={styles.buySellToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeOrderType === "buy" && styles.toggleButtonBuyActive,
            ]}
            onPress={() => setActiveOrderType("buy")}
          >
            <Text
              style={[
                styles.toggleText,
                activeOrderType === "buy" && styles.toggleTextActive,
              ]}
            >
              Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeOrderType === "sell" && styles.toggleButtonSellActive,
            ]}
            onPress={() => setActiveOrderType("sell")}
          >
            <Text
              style={[
                styles.toggleText,
                activeOrderType === "sell" && styles.toggleTextActive,
              ]}
            >
              Sell
            </Text>
          </TouchableOpacity>
        </View>

        {/* Limit/Market Tabs */}
        <View style={styles.orderModeTabs}>
          <TouchableOpacity
            style={[
              styles.orderModeTab,
              orderMode === "limit" && styles.orderModeTabActive,
            ]}
            onPress={() => setOrderMode("limit")}
          >
            <Text
              style={[
                styles.orderModeText,
                orderMode === "limit" && styles.orderModeTextActive,
              ]}
            >
              Limit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.orderModeTab,
              orderMode === "market" && styles.orderModeTabActive,
            ]}
            onPress={() => setOrderMode("market")}
          >
            <Text
              style={[
                styles.orderModeText,
                orderMode === "market" && styles.orderModeTextActive,
              ]}
            >
              Market
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Form */}
        <View style={styles.orderForm}>
          {orderMode === "limit" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={currentPrice}
                  placeholderTextColor="#666666"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputCurrency}>USDC</Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#666666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputCurrency}>
                {currentMarket?.baseAsset || "TOKEN"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.orderButton,
              activeOrderType === "buy"
                ? styles.orderButtonBuy
                : styles.orderButtonSell,
            ]}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.orderButtonText}>
              {activeOrderType === "buy" ? "Buy" : "Sell"}{" "}
              {currentMarket?.baseAsset || "TOKEN"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Book */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Book</Text>
          {showOrderBookSkeleton ? (
            <SkeletonOrderBook />
          ) : (
            <>
              {/* Asks (Sell Orders) */}
              <View style={styles.orderBookSection}>
                {asks
                  .slice(0, 5)
                  .reverse()
                  .map((ask, index) => (
                    <View key={`ask-${index}`} style={styles.orderBookRow}>
                      <Text
                        style={[styles.orderBookPrice, { color: "#E74C3C" }]}
                      >
                        {parseFloat(ask[0]).toFixed(4)}
                      </Text>
                      <Text style={styles.orderBookAmount}>
                        {parseFloat(ask[1]).toFixed(4)}
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Current Price */}
              <View style={styles.currentPriceRow}>
                <Text
                  style={[
                    styles.currentPriceLabel,
                    priceChange.isPositive
                      ? { color: "#2ECC71" }
                      : { color: "#E74C3C" },
                  ]}
                >
                  ${parseFloat(currentPrice).toFixed(4)}
                </Text>
              </View>

              {/* Bids (Buy Orders) */}
              <View style={styles.orderBookSection}>
                {bids.slice(0, 5).map((bid, index) => (
                  <View key={`bid-${index}`} style={styles.orderBookRow}>
                    <Text style={[styles.orderBookPrice, { color: "#2ECC71" }]}>
                      {parseFloat(bid[0]).toFixed(4)}
                    </Text>
                    <Text style={styles.orderBookAmount}>
                      {parseFloat(bid[1]).toFixed(4)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Recent Trades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trades</Text>
          {showTradesSkeleton ? (
            <SkeletonTrades />
          ) : (
            <View>
              {trades?.slice(0, 10).map((trade, index) => (
                <View key={`trade-${index}`} style={styles.tradeRow}>
                  <Text
                    style={[
                      styles.tradePrice,
                      trade.isBuyerMaker
                        ? { color: "#E74C3C" }
                        : { color: "#2ECC71" },
                    ]}
                  >
                    {parseFloat(trade.price).toFixed(4)}
                  </Text>
                  <Text style={styles.tradeAmount}>
                    {parseFloat(trade.qty).toFixed(4)}
                  </Text>
                  <Text style={styles.tradeTime}>
                    {new Date(trade.time).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Open Orders */}
        {walletAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Orders</Text>
            {openOrders && openOrders.length > 0 ? (
              <View>
                {openOrders.map((order, index) => (
                  <View key={`order-${index}`} style={styles.orderRow}>
                    <Text
                      style={[
                        styles.orderSide,
                        order.side === "BUY"
                          ? { color: "#2ECC71" }
                          : { color: "#E74C3C" },
                      ]}
                    >
                      {order.side}
                    </Text>
                    <Text style={styles.orderPrice}>
                      ${parseFloat(order.price).toFixed(4)}
                    </Text>
                    <Text style={styles.orderAmount}>
                      {parseFloat(order.origQty).toFixed(4)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No open orders</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Market Selector Modal */}
      <Modal
        visible={showMarketSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMarketSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Market</Text>
              <TouchableOpacity onPress={() => setShowMarketSelector(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={markets || []}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.marketItem}
                  onPress={() => handleSelectMarket(item)}
                >
                  <Text style={styles.marketSymbol}>{item.symbol}</Text>
                  <View style={styles.marketInfo}>
                    <Text style={styles.marketPrice}>
                      ${parseFloat(item.latestPrice).toFixed(4)}
                    </Text>
                    <Text style={styles.marketVolume}>
                      Vol: ${(parseFloat(item.volumeInQuote) / 1000).toFixed(1)}
                      k
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function TradeScreen() {
  return <TradeScreenContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  pairSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  pairText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#888888",
  },
  priceSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceChangePositive: {
    color: "#2ECC71",
  },
  priceChangeNegative: {
    color: "#E74C3C",
  },
  priceChangeDetail: {
    fontSize: 12,
    color: "#888888",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "#888888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timePeriodContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timePeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "#1A1A1A",
  },
  timePeriodActive: {
    backgroundColor: "#E26B1D",
  },
  timePeriodText: {
    fontSize: 12,
    color: "#888888",
  },
  timePeriodTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    minHeight: 200,
  },
  buySellToggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
  },
  toggleButtonBuyActive: {
    backgroundColor: "#2ECC71",
  },
  toggleButtonSellActive: {
    backgroundColor: "#E74C3C",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888888",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  orderModeTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 4,
  },
  orderModeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  orderModeTabActive: {
    backgroundColor: "#2A2A2A",
  },
  orderModeText: {
    fontSize: 14,
    color: "#888888",
  },
  orderModeTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  orderForm: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  inputCurrency: {
    fontSize: 14,
    color: "#888888",
  },
  orderButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  orderButtonBuy: {
    backgroundColor: "#2ECC71",
  },
  orderButtonSell: {
    backgroundColor: "#E74C3C",
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  orderBookSection: {
    marginBottom: 8,
  },
  orderBookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  orderBookPrice: {
    fontSize: 13,
    fontWeight: "600",
  },
  orderBookAmount: {
    fontSize: 13,
    color: "#888888",
  },
  currentPriceRow: {
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2A2A2A",
    marginVertical: 8,
  },
  currentPriceLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  tradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  tradePrice: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  tradeAmount: {
    fontSize: 13,
    color: "#888888",
    flex: 1,
    textAlign: "center",
  },
  tradeTime: {
    fontSize: 11,
    color: "#666666",
    flex: 1,
    textAlign: "right",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  orderSide: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  orderPrice: {
    fontSize: 13,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  orderAmount: {
    fontSize: 13,
    color: "#888888",
    flex: 1,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalClose: {
    fontSize: 24,
    color: "#888888",
  },
  marketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  marketSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  marketInfo: {
    alignItems: "flex-end",
  },
  marketPrice: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  marketVolume: {
    fontSize: 12,
    color: "#888888",
  },
});
