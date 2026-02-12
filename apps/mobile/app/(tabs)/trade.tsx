import { isConnected, useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import type { Market } from "@scalex/types";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  VictoryAxis,
  VictoryBar,
  VictoryCandlestick,
  VictoryChart,
  VictoryLine,
} from "victory-native";
import {
  useDepthWithRealtime,
  useKline,
  useMarkets,
  useOpenOrders,
  useTicker24hr,
  useTradesWithRealtime,
} from "~/src/hooks/trading";
import PlaceOrder from "../../src/components/trade/PlaceOrder";
import History from "../../src/components/trade/History";
import Chart from "../../src/components/trade/Chart";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import TokenIcon from "../../components/TokenIcon";
import {
  SkeletonChart,
  SkeletonOrderBook,
  SkeletonPriceCard,
  SkeletonTrades,
} from "../../components/ui/skeleton-loader";
import { AppHeader } from "~/components/AppHeader";

// Format price using quote decimals from market
function formatPrice(price: string | number, quoteDecimals?: number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return "0";
  // Scale by quoteDecimals (API returns raw integer value)
  const decimals = quoteDecimals ?? 6;
  const scaledNum = num / Math.pow(10, decimals);
  return scaledNum.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format amount using base decimals from market
function formatAmount(amount: string | number, baseDecimals?: number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "0";
  // Scale by baseDecimals (API returns raw integer value)
  const decimals = baseDecimals ?? 6;
  const scaledNum = num / Math.pow(10, decimals);
  return scaledNum.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

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
    "5m",
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

  // Sort markets by volume in quote (descending)
  const sortedMarkets = useMemo(() => {
    if (!markets) return [];
    return [...markets].sort(
      (a, b) =>
        parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0"),
    );
  }, [markets]);

  // Select default market (highest volume)
  React.useEffect(() => {
    if (markets && markets.length > 0 && !selectedMarket) {
      const topMarket = [...markets].sort(
        (a, b) =>
          parseFloat(b.volumeInQuote || "0") -
          parseFloat(a.volumeInQuote || "0"),
      )[0];
      setSelectedMarket(topMarket.symbol);
    }
  }, [markets, selectedMarket]);

  const currentMarket = useMemo(() => {
    return markets?.find((m) => m.symbol === selectedMarket);
  }, [markets, selectedMarket]);

  // Fetch ticker data for selected market
  const { data: ticker, refetch: refetchTicker } = useTicker24hr(
    selectedMarket || "",
    { enabled: !!selectedMarket, refetchInterval: 5000 },
  );

  // Calculate startTime based on interval to get sufficient historical data
  const startTime = useMemo(() => {
    const now = Date.now();
    const intervals: Record<typeof interval, number> = {
      "1m": 24 * 60 * 60 * 1000, // 24 hours
      "5m": 24 * 60 * 60 * 1000, // 24 hours
      "30m": 7 * 24 * 60 * 60 * 1000, // 7 days
      "1h": 30 * 24 * 60 * 60 * 1000, // 30 days
      "1d": 90 * 24 * 60 * 60 * 1000, // 90 days
    };
    return now - intervals[interval];
  }, [interval]);

  // Fetch kline data for chart
  const {
    data: klineData,
    isLoading: klineLoading,
    refetch: refetchKline,
  } = useKline(
    { symbol: selectedMarket || "", interval, startTime, limit: 5000 },
    { enabled: !!selectedMarket },
  );

  // Debug kline data

  // Fetch order book with real-time updates
  const { data: orderBook, isLoading: orderBookLoading } = useDepthWithRealtime(
    {
      symbol: selectedMarket || "",
      limit: 20,
      enableRealtime: true,
    },
  );

  // Fetch trades with real-time updates
  const { data: trades, isLoading: tradesLoading } = useTradesWithRealtime({
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

    // Scale kline values by quoteDecimals (API returns raw integer values)
    const decimals = currentMarket?.quoteDecimals ?? 6;
    const scale = Math.pow(10, decimals);

    const data = klineData.map((kline, index) => {
      // Kline is an array: [openTime, open, high, low, close, volume, closeTime, ...]
      const k = kline as unknown as (string | number)[];
      const openRaw = parseFloat(k[1] as string);
      const closeRaw = parseFloat(k[4] as string);
      const highRaw = parseFloat(k[2] as string);
      const lowRaw = parseFloat(k[3] as string);
      const volume = parseFloat(k[5] as string);
      const openTime = k[0] as number;

      // Scale after calculating isPositive to avoid precision issues
      const isPositive = closeRaw >= openRaw;

      return {
        x: index,
        open: openRaw / scale,
        close: closeRaw / scale,
        high: highRaw / scale,
        low: lowRaw / scale,
        volume,
        openTime,
        isPositive,
      };
    });

    return data;
  }, [klineData, currentMarket?.quoteDecimals]);

  // Calculate Y-axis domain from chart data
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return undefined;

    const prices = chartData.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;

    return [minPrice - padding, maxPrice + padding];
  }, [chartData]);

  // Generate Y-axis tick values
  const yTicks = useMemo(() => {
    if (!yDomain) return [];
    const [min, max] = yDomain;
    const step = (max - min) / 5;
    return Array.from({ length: 6 }, (_, i) => min + step * i);
  }, [yDomain]);

  // Generate X-axis tick values (time labels)
  const xTickValues = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Show 5 time labels evenly distributed
    const step = Math.floor(chartData.length / 5);
    return Array.from({ length: 5 }, (_, i) => i * step).filter(
      (v) => v < chartData.length,
    );
  }, [chartData]);

  // Format time label from index
  const formatTimeLabel = (value: any) => {
    const index = typeof value === "number" ? value : parseInt(value, 10);
    if (isNaN(index) || !chartData[index]) return "";
    const date = new Date(chartData[index].openTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format price label
  const formatPriceLabel = (value: any) => {
    const price = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(price)) return "";
    return price.toFixed(currentMarket?.quoteDecimals ?? 2);
  };

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
    alert("Order placement will be implemented in Phase 3");
  };

  // Show skeleton during initial load OR when refreshing (pull-to-refresh)
  // Only show skeleton if there's no data yet OR we're actively refreshing
  const showPriceSkeleton = refreshing || (marketsLoading && !markets);
  const showChartSkeleton = refreshing || (klineLoading && !klineData);
  const showOrderBookSkeleton = refreshing || (orderBookLoading && !orderBook);
  const showTradesSkeleton = refreshing || (tradesLoading && !trades);

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
        {/* Mobile Header - Price and Market Pair*/}
        <View style={styles.mobileHeader}>
          {/* Market Pair Badge - Centered with overlapping icons */}
          <TouchableOpacity
            style={styles.marketBadge}
            onPress={() => setShowMarketSelector(true)}
          >
            <View style={styles.overlappingIcons}>
              {currentMarket && (
                <>
                  <View style={styles.baseIconContainer}>
                    <TokenIcon symbol={currentMarket.baseAsset} size="xs" />
                  </View>
                  <View style={styles.quoteIconContainer}>
                    <TokenIcon symbol={currentMarket.quoteAsset} size="xs" />
                  </View>
                </>
              )}
            </View>
            <Text style={styles.marketBadgeText}>
              {currentMarket
                ? `${currentMarket.baseAsset} / ${currentMarket.quoteAsset}`
                : "Select Market"}
            </Text>
            <Text style={styles.chevronDown}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Price Display - Centered */}
        {showPriceSkeleton ? (
          <SkeletonPriceCard />
        ) : (
          <>
            {/* Large Price with Change */}
            <View style={styles.priceDisplayContainer}>
              <Text style={styles.largePPrice}>
                ${formatPrice(currentPrice, currentMarket?.quoteDecimals)}
              </Text>
              <View style={styles.priceChangeRow}>
                <View
                  style={[
                    styles.priceChangePill,
                    priceChange.isPositive
                      ? styles.priceChangePillGreen
                      : styles.priceChangePillRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceChangePercent,
                      priceChange.isPositive
                        ? styles.textGreen
                        : styles.textRed,
                    ]}
                  >
                    {priceChange.isPositive ? "↑" : "↓"}{" "}
                    {Math.abs(priceChange.percent).toFixed(2)}%
                  </Text>
                </View>
                <Text style={styles.priceChangeAmount}>
                  {priceChange.isPositive ? "+" : ""}$
                  {formatPrice(
                    Math.abs(priceChange.value),
                    currentMarket?.quoteDecimals,
                  )}{" "}
                  (24h)
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>24H HIGH</Text>
                <Text style={styles.statCardValue}>
                  $
                  {formatPrice(
                    ticker?.highPrice || "0",
                    currentMarket?.quoteDecimals,
                  )}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>24H LOW</Text>
                <Text style={styles.statCardValue}>
                  $
                  {formatPrice(
                    ticker?.lowPrice || "0",
                    currentMarket?.quoteDecimals,
                  )}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>VOLUME</Text>
                <Text style={styles.statCardValue}>
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

        {/* Chart Component */}
        {!showChartSkeleton ? (
          <Chart
            chartData={chartData}
            currentPrice={currentPrice}
            quoteDecimals={currentMarket?.quoteDecimals ?? 6}
            interval={interval}
            onIntervalChange={setInterval}
            yDomain={yDomain}
            yTicks={yTicks}
            formatPriceLabel={formatPriceLabel}
            xTickValues={xTickValues}
            formatTimeLabel={formatTimeLabel}
          />
        ) : (
          <View style={styles.chartContainer}>
            <SkeletonChart />
          </View>
        )}

        {/* PlaceOrder Component with Integrated OrderBook */}
        {currentMarket && (
          <PlaceOrder
            symbol={currentMarket.symbol}
            baseAsset={currentMarket.baseAsset}
            quoteAsset={currentMarket.quoteAsset}
            baseDecimals={currentMarket.baseDecimals}
            quoteDecimals={currentMarket.quoteDecimals}
            currentPrice={currentPrice}
            onRefresh={handleRefresh}
          />
        )}

        {/* History Component with Recent Trades and Open Orders */}
        {currentMarket && (
          <History
            symbol={currentMarket.symbol}
            baseAsset={currentMarket.baseAsset}
            quoteAsset={currentMarket.quoteAsset}
            baseDecimals={currentMarket.baseDecimals}
            quoteDecimals={currentMarket.quoteDecimals}
          />
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
              data={sortedMarkets}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.marketItem}
                  onPress={() => handleSelectMarket(item)}
                >
                  <TokenIcon symbol={item.baseAsset} size="md" />
                  <View style={styles.marketItemText}>
                    <Text style={styles.marketSymbol}>
                      {item.baseAsset}/{item.quoteAsset}
                    </Text>
                    <View style={styles.marketInfo}>
                      <Text style={styles.marketPrice}>
                        ${formatPrice(item.latestPrice, item.quoteDecimals)}
                      </Text>
                      <Text style={styles.marketVolume}>
                        Vol: $
                        {(parseFloat(item.volumeInQuote) / 1000).toFixed(1)}k
                      </Text>
                    </View>
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
  // Web Mobile Aligned Styles
  mobileHeader: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  marketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#111111",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222222",
  },
  overlappingIcons: {
    flexDirection: "row",
  },
  baseIconContainer: {
    zIndex: 10,
  },
  quoteIconContainer: {
    zIndex: 0,
    marginLeft: -6,
  },
  marketBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  chevronDown: {
    color: "#666666",
    fontSize: 10,
  },
  priceDisplayContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  largePPrice: {
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "600",
  },
  priceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  priceChangePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceChangePillGreen: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
  },
  priceChangePillRed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  priceChangePercent: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  textGreen: {
    color: "#2ECC71",
  },
  textRed: {
    color: "#EF4444",
  },
  priceChangeAmount: {
    color: "#666666",
    fontSize: 12,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flexDirection: "column",
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  statCardLabel: {
    color: "#666666",
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  statCardValue: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  // Remove old styles
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
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
    minHeight: 280,
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
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  marketItemText: {
    flex: 1,
    marginLeft: 12,
  },
  marketSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
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
