import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useDepthWithRealtime } from "~/src/hooks/trading";
import type { MarketInfo } from "./types";
import { toSymbol } from "./types";

interface OrderBookProps {
  market: MarketInfo;
}

export default function OrderBook({ market }: OrderBookProps) {
  const { baseDecimals, quoteDecimals } = market;
  const symbol = toSymbol(market);

  const [priceDirection, setPriceDirection] = useState<"up" | "down">("up");
  const prevPriceRef = useRef<string | null>(null);

  // Fetch order book with real-time updates
  const { data: orderBook, isLoading } = useDepthWithRealtime({
    symbol,
    limit: 5,
    enableRealtime: true,
  });

  // Track price direction
  useEffect(() => {
    if (orderBook?.bids?.[0]?.[0]) {
      const currentPrice = orderBook.bids[0][0];
      if (prevPriceRef.current !== null) {
        const current = parseFloat(currentPrice);
        const previous = parseFloat(prevPriceRef.current);
        if (current > previous) {
          setPriceDirection("up");
        } else if (current < previous) {
          setPriceDirection("down");
        }
      }
      prevPriceRef.current = currentPrice;
    }
  }, [orderBook?.bids]);

  // Format price
  const formatPrice = (price: string): string => {
    const num = parseFloat(price) / Math.pow(10, quoteDecimals);
    return num.toFixed(Math.min(quoteDecimals, 2));
  };

  // Format amount
  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount) / Math.pow(10, baseDecimals);
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toFixed(2);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>PRICE</Text>
          <Text style={styles.headerText}>AMT</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666666" />
        </View>
      </View>
    );
  }

  if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>PRICE</Text>
          <Text style={styles.headerText}>AMT</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      </View>
    );
  }

  const asksData = orderBook.asks.slice(0, 5);
  const bidsData = orderBook.bids.slice(0, 5);

  // Calculate max amounts for bar visualization
  const allAmounts = [...asksData, ...bidsData].map(
    ([, amount]) => parseFloat(amount) / 10 ** baseDecimals,
  );
  const maxAmount = Math.max(...allAmounts);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>PRICE</Text>
        <Text style={styles.headerText}>AMT</Text>
      </View>

      {/* Asks (Sells) - Red - Reversed order */}
      <View style={styles.asksContainer}>
        {asksData.reverse().map(([price, amount], index) => {
          const amountNum = parseFloat(amount) / 10 ** baseDecimals;
          const percentage = (amountNum / maxAmount) * 100;

          return (
            <View key={`ask-${index}`} style={styles.orderRow}>
              <View
                style={[
                  styles.depthBar,
                  styles.depthBarRed,
                  { width: `${percentage}%` },
                ]}
              />
              <Text style={styles.priceRed}>{formatPrice(price)}</Text>
              <Text style={styles.amount}>{formatAmount(amount)}</Text>
            </View>
          );
        })}
      </View>

      {/* Current Price */}
      <View style={styles.currentPriceRow}>
        <Text style={styles.currentPrice}>
          {orderBook.bids[0] ? formatPrice(orderBook.bids[0][0]) : "--"}
        </Text>
        <Text
          style={priceDirection === "up" ? styles.arrowUp : styles.arrowDown}
        >
          {priceDirection === "up" ? "↑" : "↓"}
        </Text>
      </View>

      {/* Bids (Buys) - Green */}
      <View style={styles.bidsContainer}>
        {bidsData.map(([price, amount], index) => {
          const amountNum = parseFloat(amount) / 10 ** baseDecimals;
          const percentage = (amountNum / maxAmount) * 100;

          return (
            <View key={`bid-${index}`} style={styles.orderRow}>
              <View
                style={[
                  styles.depthBar,
                  styles.depthBarGreen,
                  { width: `${percentage}%` },
                ]}
              />
              <Text style={styles.priceGreen}>{formatPrice(price)}</Text>
              <Text style={styles.amount}>{formatAmount(amount)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    width: "100%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: "#555555",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    color: "#666666",
  },
  asksContainer: {
    flexDirection: "column-reverse",
    gap: 1,
  },
  bidsContainer: {
    flexDirection: "column",
    gap: 1,
  },
  orderRow: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  depthBar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
  },
  depthBarRed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  depthBarGreen: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
  },
  priceRed: {
    fontSize: 12,
    lineHeight: 16,
    color: "#EF4444",
    zIndex: 1,
  },
  priceGreen: {
    fontSize: 12,
    lineHeight: 16,
    color: "#2ECC71",
    zIndex: 1,
  },
  amount: {
    fontSize: 12,
    lineHeight: 16,
    color: "#888888",
    zIndex: 1,
  },
  currentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  currentPrice: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  arrowUp: {
    fontSize: 14,
    color: "#10B981",
  },
  arrowDown: {
    fontSize: 14,
    color: "#EF4444",
  },
});
