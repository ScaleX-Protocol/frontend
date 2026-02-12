import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useOpenOrders, useTradesWithRealtime } from "~/src/hooks/trading";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";

interface HistoryProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  baseDecimals: number;
  quoteDecimals: number;
}

type HistoryTab = "orders" | "trades";

const TABS: { key: HistoryTab; label: string }[] = [
  { key: "orders", label: "Open Orders" },
  { key: "trades", label: "Recent Trades" },
];

export default function History({
  symbol,
  baseAsset,
  quoteAsset,
  baseDecimals,
  quoteDecimals,
}: HistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
  const { address: walletAddress } = useWalletMobile();

  // Fetch open orders
  const { data: openOrdersData, isLoading: isLoadingOrders } = useOpenOrders({
    userAddress: walletAddress || "",
    symbol,
  });

  // Fetch recent trades
  const { data: tradesData, isLoading: isLoadingTrades } =
    useTradesWithRealtime({
      symbol,
      limit: 20,
      enableRealtime: true,
    });

  const openOrders = openOrdersData?.orders || [];
  const trades = tradesData || [];

  // Format price
  const formatPrice = (price: string): string => {
    const num = parseFloat(price) / Math.pow(10, quoteDecimals);
    return num.toFixed(Math.min(quoteDecimals, 2));
  };

  // Format amount
  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount) / Math.pow(10, baseDecimals);
    return num.toFixed(2);
  };

  // Format time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.underline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Open Orders Tab */}
        {activeTab === "orders" && (
          <View style={styles.tabContent}>
            {isLoadingOrders ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            ) : openOrders.length > 0 ? (
              <View>
                {/* Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerText, { flex: 1 }]}>SIDE</Text>
                  <Text
                    style={[styles.headerText, { flex: 1, textAlign: "right" }]}
                  >
                    PRICE
                  </Text>
                  <Text
                    style={[styles.headerText, { flex: 1, textAlign: "right" }]}
                  >
                    AMOUNT
                  </Text>
                </View>
                {/* Rows */}
                {openOrders.map((order: any, index: number) => (
                  <View key={`order-${index}`} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.sideText,
                        { flex: 1 },
                        order.side === "BUY" ? styles.buyText : styles.sellText,
                      ]}
                    >
                      {order.side}
                    </Text>
                    <Text
                      style={[styles.rowText, { flex: 1, textAlign: "right" }]}
                    >
                      ${formatPrice(order.price)}
                    </Text>
                    <Text
                      style={[styles.rowText, { flex: 1, textAlign: "right" }]}
                    >
                      {formatAmount(order.origQty)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {walletAddress
                    ? "No open orders"
                    : "Connect wallet to view orders"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Trades Tab */}
        {activeTab === "trades" && (
          <View style={styles.tabContent}>
            {isLoadingTrades ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            ) : trades.length > 0 ? (
              <View>
                {/* Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerText, { flex: 1 }]}>PRICE</Text>
                  <Text
                    style={[styles.headerText, { flex: 1, textAlign: "right" }]}
                  >
                    AMOUNT
                  </Text>
                  <Text
                    style={[styles.headerText, { flex: 1, textAlign: "right" }]}
                  >
                    TIME
                  </Text>
                </View>
                {/* Rows */}
                {trades.slice(0, 15).map((trade: any, index: number) => (
                  <View key={`trade-${index}`} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.priceText,
                        { flex: 1 },
                        trade.isBuyerMaker ? styles.sellText : styles.buyText,
                      ]}
                    >
                      ${formatPrice(trade.price)}
                    </Text>
                    <Text
                      style={[styles.rowText, { flex: 1, textAlign: "right" }]}
                    >
                      {formatAmount(trade.qty)}
                    </Text>
                    <Text
                      style={[styles.timeText, { flex: 1, textAlign: "right" }]}
                    >
                      {formatTime(trade.time)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent trades</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  tab: {
    paddingVertical: 12,
    position: "relative",
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
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#F97316",
  },
  content: {
    flexDirection: "column",
  },
  tabContent: {
    flexDirection: "column",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: "#666666",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  sideText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  buyText: {
    color: "#2ECC71",
  },
  sellText: {
    color: "#EF4444",
  },
  priceText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  rowText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#FFFFFF",
  },
  timeText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#888888",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#666666",
  },
});
