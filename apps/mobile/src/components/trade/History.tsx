import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAllOrders, useOpenOrders, useAccount } from "~/src/hooks/trading";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";
import type { MarketInfo } from "./types";
import { toSymbol } from "./types";

interface HistoryProps {
  market: MarketInfo | null;
}

type HistoryTab = "orders" | "history" | "positions";

const TABS: { key: HistoryTab; label: string }[] = [
  { key: "orders", label: "Open Orders" },
  { key: "history", label: "History" },
  { key: "positions", label: "Positions" },
];

// Format price with decimals
function fmtPrice(price: string, quoteDecimals: number): string {
  const num = parseFloat(price) / Math.pow(10, quoteDecimals);
  if (isNaN(num)) return "0.00";
  return num.toFixed(Math.min(quoteDecimals, 2));
}

// Format amount with decimals
function fmtAmount(amount: string, baseDecimals: number): string {
  const num = parseFloat(amount) / Math.pow(10, baseDecimals);
  if (isNaN(num)) return "0.00";
  return num.toFixed(4);
}

// Format balance number
function fmtBalance(val: number, decimals = 2): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format timestamp for display (e.g. "Feb 19, 02:45 PM")
function fmtTime(timestamp: string | number): string {
  const date = new Date(
    typeof timestamp === "string" ? parseInt(timestamp) : timestamp,
  );
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

// Open Order Card — matches web OpenOrderCard design
function OpenOrderCard({
  order,
  baseDecimals,
  quoteDecimals,
}: {
  order: any;
  baseDecimals: number;
  quoteDecimals: number;
}) {
  const isBuy = order.side === "BUY";
  const baseSymbol = order.symbol?.split("/")[0] || "WETH";
  const origQty = parseFloat(order.origQty || "0");
  const executedQty = parseFloat(order.executedQty || "0");
  const filledPercent = origQty > 0 ? Math.min((executedQty / origQty) * 100, 100) : 0;

  return (
    <View style={cardStyles.card}>
      {/* Header: Side badge + time */}
      <View style={cardStyles.rowBetween}>
        <View style={cardStyles.row}>
          <View
            style={[
              cardStyles.sideDot,
              { backgroundColor: isBuy ? "#2ECC71" : "#EF4444" },
            ]}
          />
          <Text style={cardStyles.titleText}>
            {isBuy ? "Buy" : "Sell"} {baseSymbol}
          </Text>
          <View style={cardStyles.typeBadge}>
            <Text style={cardStyles.typeBadgeText}>{order.type || "Limit"}</Text>
          </View>
        </View>
        <Text style={cardStyles.timeText}>{fmtTime(order.time)}</Text>
      </View>

      {/* Price / Amount row */}
      <View style={[cardStyles.rowBetween, { marginTop: 8 }]}>
        <View>
          <Text style={cardStyles.labelText}>PRICE</Text>
          <Text style={cardStyles.valueText}>
            {fmtPrice(order.price, quoteDecimals)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={cardStyles.labelText}>AMOUNT</Text>
          <Text style={cardStyles.valueText}>
            {fmtAmount(order.executedQty || "0", baseDecimals)} /{" "}
            {fmtAmount(order.origQty, baseDecimals)} {baseSymbol}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={cardStyles.progressBg}>
        <View
          style={[
            cardStyles.progressFill,
            {
              width: `${filledPercent}%`,
              backgroundColor: isBuy ? "#2ECC71" : "#EF4444",
            },
          ]}
        />
      </View>

      {/* Actions */}
      <View style={[cardStyles.row, { justifyContent: "flex-end", gap: 16, marginTop: 8 }]}>
        <TouchableOpacity>
          <Text style={cardStyles.modifyBtn}>Modify</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={cardStyles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Order History Card (filled / cancelled orders)
function OrderHistoryCard({
  order,
  baseDecimals,
  quoteDecimals,
}: {
  order: any;
  baseDecimals: number;
  quoteDecimals: number;
}) {
  const isBuy = order.side === "BUY";
  const baseSymbol = order.symbol?.split("/")[0] || "WETH";
  const statusColors: Record<string, string> = {
    FILLED: "#2ECC71",
    CANCELED: "#666666",
    PARTIALLY_FILLED: "#F97316",
    REJECTED: "#EF4444",
  };
  const statusColor = statusColors[order.status] || "#888888";

  return (
    <View style={[cardStyles.card, { borderColor: "#1A1A1A" }]}>
      {/* Header */}
      <View style={cardStyles.rowBetween}>
        <View style={cardStyles.row}>
          <View
            style={[
              cardStyles.sideDot,
              { backgroundColor: isBuy ? "#2ECC71" : "#EF4444" },
            ]}
          />
          <Text style={cardStyles.titleText}>
            {isBuy ? "Buy" : "Sell"} {baseSymbol}
          </Text>
          <View style={cardStyles.typeBadge}>
            <Text style={cardStyles.typeBadgeText}>{order.type || "Limit"}</Text>
          </View>
        </View>
        <Text style={cardStyles.timeText}>{fmtTime(order.time)}</Text>
      </View>

      {/* Price / Amount */}
      <View style={[cardStyles.rowBetween, { marginTop: 8 }]}>
        <View>
          <Text style={cardStyles.labelText}>PRICE</Text>
          <Text style={cardStyles.valueText}>
            {fmtPrice(order.price, quoteDecimals)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={cardStyles.labelText}>FILLED / TOTAL</Text>
          <Text style={cardStyles.valueText}>
            {fmtAmount(order.executedQty || "0", baseDecimals)} /{" "}
            {fmtAmount(order.origQty, baseDecimals)} {baseSymbol}
          </Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={[cardStyles.row, { justifyContent: "flex-end", marginTop: 8 }]}>
        <View
          style={[
            cardStyles.statusBadge,
            { backgroundColor: statusColor + "22", borderColor: statusColor + "55" },
          ]}
        >
          <Text style={[cardStyles.statusBadgeText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Balances / Positions tab
function PositionsTab({
  walletAddress,
  symbol,
}: {
  walletAddress: string | null;
  symbol: string;
}) {
  const { data: accountData, isLoading } = useAccount(walletAddress || "", {
    enabled: !!walletAddress,
  });

  if (!walletAddress) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Connect wallet to view positions</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#666666" />
      </View>
    );
  }

  const balances = accountData?.balances || [];

  if (balances.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No positions yet</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 2 }]}>ASSET</Text>
        <Text style={[styles.headerText, { flex: 2, textAlign: "right" }]}>FREE</Text>
        <Text style={[styles.headerText, { flex: 2, textAlign: "right" }]}>LOCKED</Text>
      </View>
      {balances.map((b: any, i: number) => {
        const free = parseFloat(b.free || "0") / Math.pow(10, b.decimals ?? 6);
        const locked = parseFloat(b.locked || "0") / Math.pow(10, b.decimals ?? 6);
        return (
          <View key={`pos-${i}`} style={styles.tableRow}>
            <Text style={[styles.assetText, { flex: 2 }]}>{b.asset}</Text>
            <Text style={[styles.rowText, { flex: 2, textAlign: "right" }]}>
              {fmtBalance(free, 4)}
            </Text>
            <Text style={[styles.rowText, { flex: 2, textAlign: "right" }]}>
              {fmtBalance(locked, 4)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function History({ market }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
  const { walletAddress } = useWalletMobile();

  if (!market) return null;

  const { baseAsset, quoteAsset, baseDecimals, quoteDecimals } = market;
  const symbol = `${baseAsset}/${quoteAsset}`;

  // Open Orders
  const { data: openOrdersData, isLoading: isLoadingOrders } = useOpenOrders({
    address: walletAddress || "",
    symbol,
    limit: 20,
  });

  // All Orders (history)
  const { data: allOrdersData, isLoading: isLoadingHistory } = useAllOrders({
    address: walletAddress || "",
    symbol,
    limit: 50,
  });

  const openOrders = openOrdersData || [];
  const allOrders = allOrdersData || [];

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

      {/* === OPEN ORDERS TAB === */}
      {activeTab === "orders" && (
        <View style={styles.tabContent}>
          {isLoadingOrders ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666666" />
            </View>
          ) : openOrders.length > 0 ? (
            <View>
              {openOrders.map((order: any, i: number) => (
                <View key={order.orderId || `order-${i}`} style={{ marginBottom: 8 }}>
                  <OpenOrderCard
                    order={order}
                    baseDecimals={baseDecimals}
                    quoteDecimals={quoteDecimals}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {walletAddress
                  ? "No open orders yet. Place your first order to start trading!"
                  : "Connect wallet to view orders"}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === "history" && (
        <View style={styles.tabContent}>
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666666" />
            </View>
          ) : allOrders.length > 0 ? (
            <View>
              {allOrders.map((order: any, i: number) => (
                <View key={order.orderId || `hist-${i}`} style={{ marginBottom: 8 }}>
                  <OrderHistoryCard
                    order={order}
                    baseDecimals={baseDecimals}
                    quoteDecimals={quoteDecimals}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {walletAddress
                  ? "Your order history is empty. Start trading to see your orders here!"
                  : "Connect wallet to view order history"}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* === POSITIONS TAB === */}
      {activeTab === "positions" && (
        <View style={styles.tabContent}>
          <PositionsTab walletAddress={walletAddress} symbol={symbol} />
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    padding: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideDot: {
    width: 4,
    height: 16,
    borderRadius: 99,
  },
  titleText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    lineHeight: 15,
    color: "#888888",
  },
  timeText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#555555",
  },
  labelText: {
    fontSize: 10,
    lineHeight: 20,
    color: "#666666",
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#CCCCCC",
  },
  progressBg: {
    height: 4,
    backgroundColor: "#222222",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  modifyBtn: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#666666",
  },
  cancelBtn: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#EF4444",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
    marginBottom: 12,
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
  tabContent: {
    flexDirection: "column",
    backgroundColor: "transparent",
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    alignItems: "center",
  },
  assetText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  rowText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#CCCCCC",
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
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666666",
    textAlign: "center",
  },
});
