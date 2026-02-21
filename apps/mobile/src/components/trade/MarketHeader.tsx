import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Animated,
} from "react-native";
import type { Market } from "@scalex/types";
import TokenIcon from "~/components/TokenIcon";
import type { MarketInfo } from "./types";
import { toSymbol } from "./types";
import { useTicker24hr } from "~/src/hooks/trading";

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function usePulse() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonBlock({
  width, height, borderRadius = 6, style,
}: { width: number | string; height: number; borderRadius?: number; style?: object }) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#2A2A2A", opacity }, style]}
    />
  );
}

function SkeletonPriceHeader() {
  return (
    <View style={styles.priceHeaderSkeleton}>
      {/* large price */}
      <SkeletonBlock width={200} height={40} borderRadius={8} style={{ marginBottom: 8 }} />
      {/* change pill + amount */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SkeletonBlock width={72} height={22} borderRadius={6} />
        <SkeletonBlock width={100} height={14} borderRadius={6} />
      </View>
      {/* stats row */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        <SkeletonBlock width={90} height={40} borderRadius={8} />
        <SkeletonBlock width={90} height={40} borderRadius={8} />
        <SkeletonBlock width={90} height={40} borderRadius={8} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

function formatPrice(price: string | number, quoteDecimals: number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return "0";
  const scaled = num / Math.pow(10, quoteDecimals);
  return scaled.toLocaleString("en-US", {
    minimumFractionDigits: quoteDecimals,
    maximumFractionDigits: quoteDecimals,
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarketHeaderProps {
  market: MarketInfo | null;
  markets: Market[];
  isLoading: boolean;
  favoriteMarkets: string[];
  onSelectMarket: (market: Market) => void;
  onToggleFavorite: (poolId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketHeader({
  market,
  markets,
  isLoading,
  favoriteMarkets,
  onSelectMarket,
  onToggleFavorite,
}: MarketHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");

  // Ticker fetched here — MarketHeader is the only consumer of price/change
  const symbol = market ? toSymbol(market) : "";
  const { data: ticker } = useTicker24hr(symbol, {
    enabled: !!symbol,
    refetchInterval: 5000,
  });

  const currentPrice = ticker?.lastPrice || "0";
  const priceChange = useMemo(() => {
    const change = parseFloat(ticker?.priceChange || "0");
    const percent = parseFloat(ticker?.priceChangePercent || "0");
    return { value: change, percent, isPositive: change >= 0 };
  }, [ticker]);

  // Sorted + filtered market list for modal
  const sortedMarkets = useMemo(() => {
    if (!markets.length) return [];
    return [...markets].sort(
      (a, b) => parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
    );
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    let list = sortedMarkets;
    if (activeTab === "favorites") {
      list = list.filter((m) => favoriteMarkets.includes(m.poolId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.baseAsset.toLowerCase().includes(q) ||
          m.quoteAsset.toLowerCase().includes(q) ||
          m.symbol?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sortedMarkets, searchQuery, activeTab, favoriteMarkets]);

  const handleSelectMarket = useCallback(
    (m: Market) => {
      onSelectMarket(m);
      setShowModal(false);
    },
    [onSelectMarket]
  );

  return (
    <>
      {/* ── Market Badge ── */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.marketBadge}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.overlappingIcons}>
            {market && (
              <>
                <View style={styles.baseIconContainer}>
                  <TokenIcon symbol={market.baseAsset} size="xs" />
                </View>
                <View style={styles.quoteIconContainer}>
                  <TokenIcon symbol={market.quoteAsset} size="xs" />
                </View>
              </>
            )}
          </View>
          <Text style={styles.marketBadgeText}>
            {market
              ? `${market.baseAsset} / ${market.quoteAsset}`
              : "Select Market"}
          </Text>
          <Text style={styles.chevronDown}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* ── Price + Stats ── */}
      {isLoading ? (
        <SkeletonPriceHeader />
      ) : market ? (
        <>
          <View style={styles.priceDisplayContainer}>
            <Text style={styles.largePrice}>
              ${formatPrice(currentPrice, market.quoteDecimals)}
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
                    priceChange.isPositive ? styles.textGreen : styles.textRed,
                  ]}
                >
                  {priceChange.isPositive ? "↑" : "↓"}{" "}
                  {Math.abs(priceChange.percent).toFixed(2)}%
                </Text>
              </View>
              <Text style={styles.priceChangeAmount}>
                {priceChange.isPositive ? "+" : ""}$
                {formatPrice(Math.abs(priceChange.value), market.quoteDecimals)}{" "}
                (24h)
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>24H HIGH</Text>
              <Text style={styles.statCardValue}>
                ${formatPrice(ticker?.highPrice || "0", market.quoteDecimals)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>24H LOW</Text>
              <Text style={styles.statCardValue}>
                ${formatPrice(ticker?.lowPrice || "0", market.quoteDecimals)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>VOLUME</Text>
              <Text style={styles.statCardValue}>
                $
                {(parseFloat(ticker?.quoteVolume || "0") / 1_000_000).toFixed(2)}
                M
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noMarketContainer}>
          <Text style={styles.noMarketText}>Select a market to start trading</Text>
        </View>
      )}

      {/* ── Market Selector Modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle}>
              <View style={styles.dragHandleBar} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Spot Markets</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search markets..."
                placeholderTextColor="#A0A0A0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.mktTabsRow}>
              {(["all", "favorites"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.mktTab, activeTab === tab && styles.mktTabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[styles.mktTabText, activeTab === tab && styles.mktTabTextActive]}
                  >
                    {tab === "all" ? "All" : "Favorites"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={filteredMarkets}
              keyExtractor={(item) => item.poolId}
              contentContainerStyle={styles.mktListContent}
              ListEmptyComponent={
                <View style={styles.mktEmptyContainer}>
                  <Text style={styles.mktEmptyText}>
                    {activeTab === "favorites"
                      ? "No favorite markets yet. Tap ⭐ to add favorites."
                      : "No markets found."}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  market?.baseAsset === item.baseAsset &&
                  market?.quoteAsset === item.quoteAsset;
                const isFavorite = favoriteMarkets.includes(item.poolId);
                const priceNum =
                  parseFloat(item.latestPrice) /
                  Math.pow(10, item.quoteDecimals ?? 6);
                const displayPrice =
                  priceNum < 1 ? priceNum.toFixed(6) : priceNum.toFixed(2);
                const vol =
                  parseFloat(item.volumeInQuote || "0") /
                  Math.pow(10, item.quoteDecimals ?? 6);
                const displayVol =
                  vol >= 1_000_000
                    ? `$${(vol / 1_000_000).toFixed(2)}M`
                    : vol >= 1_000
                    ? `$${(vol / 1_000).toFixed(2)}K`
                    : `$${vol.toFixed(2)}`;

                return (
                  <TouchableOpacity
                    style={[styles.mktCard, isSelected && styles.mktCardSelected]}
                    onPress={() => handleSelectMarket(item)}
                  >
                    <TouchableOpacity
                      style={styles.starBtn}
                      onPress={() => onToggleFavorite(item.poolId)}
                    >
                      <Text
                        style={[styles.starIcon, isFavorite && styles.starIconActive]}
                      >
                        {isFavorite ? "★" : "☆"}
                      </Text>
                    </TouchableOpacity>
                    <TokenIcon symbol={item.baseAsset} size="sm" />
                    <View style={styles.mktCardSymbolCol}>
                      <View style={styles.mktCardSymbolRow}>
                        <Text style={styles.mktCardSymbol}>
                          {item.baseAsset}/{item.quoteAsset}
                        </Text>
                        <View style={styles.spotBadge}>
                          <Text style={styles.spotBadgeText}>SPOT</Text>
                        </View>
                      </View>
                      <Text style={styles.mktCardVol}>Vol: {displayVol}</Text>
                    </View>
                    <View style={styles.mktCardPriceCol}>
                      <Text style={styles.mktCardPrice}>${displayPrice}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalFooter}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>Live Data</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
  overlappingIcons: { flexDirection: "row" },
  baseIconContainer: { zIndex: 10 },
  quoteIconContainer: { zIndex: 0, marginLeft: -6 },
  marketBadgeText: { color: "#FFFFFF", fontSize: 12, lineHeight: 16, fontWeight: "500" },
  chevronDown: { color: "#666666", fontSize: 10 },
  priceHeaderSkeleton: {
    paddingHorizontal: 20,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  priceDisplayContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  largePrice: { color: "#FFFFFF", fontSize: 36, lineHeight: 40, fontWeight: "600" },
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
  priceChangePillGreen: { backgroundColor: "rgba(46, 204, 113, 0.1)" },
  priceChangePillRed: { backgroundColor: "rgba(239, 68, 68, 0.1)" },
  priceChangePercent: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  textGreen: { color: "#2ECC71" },
  textRed: { color: "#EF4444" },
  priceChangeAmount: { color: "#666666", fontSize: 12, lineHeight: 16 },
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
  statCardLabel: { color: "#666666", fontSize: 10, lineHeight: 15, letterSpacing: 0.5 },
  statCardValue: { color: "#FFFFFF", fontSize: 12, lineHeight: 16, fontWeight: "500" },
  noMarketContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noMarketText: { color: "#555555", fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#1F1F1F",
    borderBottomWidth: 0,
  },
  dragHandle: { alignItems: "center", paddingVertical: 12 },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: { fontSize: 14, color: "#888888" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: "#FFFFFF", padding: 0 },
  searchClear: { fontSize: 14, color: "#666666" },
  mktTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
  },
  mktTab: { paddingBottom: 8 },
  mktTabActive: { borderBottomWidth: 2, borderBottomColor: "#E26B1D" },
  mktTabText: { fontSize: 14, fontWeight: "500", color: "#666666" },
  mktTabTextActive: { color: "#FFFFFF" },
  mktListContent: { paddingHorizontal: 20, paddingBottom: 8 },
  mktEmptyContainer: { paddingVertical: 32, alignItems: "center" },
  mktEmptyText: { fontSize: 13, color: "#666666", textAlign: "center" },
  mktCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#0F0F0F",
  },
  mktCardSelected: { backgroundColor: "rgba(226,107,29,0.06)" },
  starBtn: { paddingHorizontal: 4 },
  starIcon: { fontSize: 18, color: "#333333" },
  starIconActive: { color: "#F59E0B" },
  mktCardSymbolCol: { flex: 1 },
  mktCardSymbolRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mktCardSymbol: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  spotBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#333333",
  },
  spotBadgeText: { fontSize: 9, fontWeight: "600", color: "#666666" },
  mktCardVol: { fontSize: 11, color: "#555555", marginTop: 2 },
  mktCardPriceCol: { alignItems: "flex-end" },
  mktCardPrice: { fontSize: 13, fontWeight: "500", color: "#CCCCCC" },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#111111",
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ECC71",
  },
  liveText: { fontSize: 11, color: "#555555" },
});
