import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import OrderBook from "./OrderBook";
import type { MarketInfo } from "./types";

interface PlaceOrderProps {
  market: MarketInfo | null;
  onRefresh?: () => void;
}

const PERCENTAGE_STEPS = [0, 25, 50, 75, 100];

export default function PlaceOrder({ market, onRefresh }: PlaceOrderProps) {
  const [buySell, setBuySell] = useState<"buy" | "sell">("buy");
  const [activeTab, setActiveTab] = useState<"limit" | "market">("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [sliderPercent, setSliderPercent] = useState(0);

  if (!market) return null;

  const { baseAsset, quoteAsset, baseDecimals, quoteDecimals } = market;

  // TODO: integrate real balance
  const availableBalance = "0.00";
  const availableSymbol = buySell === "buy" ? quoteAsset : baseAsset;

  const handleSliderStep = (pct: number) => {
    setSliderPercent(pct);
    // TODO: compute amount from balance when wallet connected
  };

  const handlePlaceOrder = () => {
    // TODO: Implement order placement with Privy
    console.log("Order placement:", { buySell, activeTab, amount, price });
  };

  const sliderColor = buySell === "buy" ? "#E26B1D" : "#E26B1D";

  return (
    <View style={styles.container}>
      {/* ── Buy / Sell Toggle ── */}
      <View style={styles.buySellToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            buySell === "buy" && styles.toggleButtonBuyActive,
          ]}
          onPress={() => setBuySell("buy")}
        >
          <Text
            style={[
              styles.toggleText,
              buySell === "buy" && styles.toggleTextBuyActive,
            ]}
          >
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            buySell === "sell" && styles.toggleButtonSellActive,
          ]}
          onPress={() => setBuySell("sell")}
        >
          <Text
            style={[
              styles.toggleText,
              buySell === "sell" && styles.toggleTextSellActive,
            ]}
          >
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Side-by-side: Form + Order Book ── */}
      <View style={styles.sideBySideLayout}>
        {/* ── Left: Place Order Form ── */}
        <View style={styles.formContainer}>
          {/* Limit / Market tabs row */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={styles.orderModeTab}
              onPress={() => setActiveTab("limit")}
            >
              <Text
                style={[
                  styles.orderModeText,
                  activeTab === "limit" && styles.orderModeTextActive,
                ]}
              >
                Limit
              </Text>
              {activeTab === "limit" && <View style={styles.underline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orderModeTab}
              onPress={() => setActiveTab("market")}
            >
              <Text
                style={[
                  styles.orderModeText,
                  activeTab === "market" && styles.orderModeTextActive,
                ]}
              >
                Market
              </Text>
              {activeTab === "market" && <View style={styles.underline} />}
            </TouchableOpacity>
          </View>

          {/* Available row */}
          <View style={styles.availableRow}>
            <Text style={styles.availableLabel}>Available</Text>
            <View style={styles.availableRight}>
              <Text style={styles.availableAmount}>{availableBalance}</Text>
              <Text style={styles.availableSymbol}>{availableSymbol}</Text>
              <TouchableOpacity>
                <Text style={styles.maxButton}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Input — pill style (Limit only) */}
          {activeTab === "limit" && (
            <View style={styles.pillInput}>
              <View style={styles.pillInputHeader}>
                <Text style={styles.pillInputLabel}>Price</Text>
                <Text style={styles.pillInputUnit}>{quoteAsset}</Text>
              </View>
              <TextInput
                style={styles.pillInputField}
                placeholder="0.00"
                placeholderTextColor="#555555"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Amount Input — pill style */}
          <View style={styles.pillInput}>
            <View style={styles.pillInputHeader}>
              <Text style={styles.pillInputLabel}>Amount</Text>
              <Text style={styles.pillInputUnit}>{baseAsset}</Text>
            </View>
            <TextInput
              style={styles.pillInputField}
              placeholder="0.00"
              placeholderTextColor="#555555"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Percentage Slider Steps */}
          <View style={styles.sliderStepsRow}>
            {PERCENTAGE_STEPS.map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[
                  styles.sliderStep,
                  sliderPercent >= pct && {
                    backgroundColor: sliderColor + "33",
                    borderColor: sliderColor,
                  },
                ]}
                onPress={() => handleSliderStep(pct)}
              >
                <Text
                  style={[
                    styles.sliderStepText,
                    sliderPercent >= pct && { color: sliderColor },
                  ]}
                >
                  {pct === 0 ? "0%" : `${pct}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.orderButton,
              buySell === "buy"
                ? styles.orderButtonBuy
                : styles.orderButtonSell,
            ]}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.orderButtonText}>
              {buySell === "buy" ? "Buy" : "Sell"} {baseAsset}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Right: Order Book ── */}
        <View style={styles.orderBookContainer}>
          <OrderBook market={market} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  /* ── Buy/Sell Toggle ── */
  buySellToggle: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  toggleButtonBuyActive: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
  },
  toggleButtonSellActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  toggleText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: "#666666",
  },
  toggleTextBuyActive: {
    color: "#2ECC71",
  },
  toggleTextSellActive: {
    color: "#EF4444",
  },

  /* ── Side-by-side ── */
  sideBySideLayout: {
    flexDirection: "row",
    gap: 16,
  },
  formContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    gap: 12,
  },

  /* ── Limit/Market Tabs ── */
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    paddingBottom: 0,
  },
  orderModeTab: {
    paddingBottom: 6,
    position: "relative",
  },
  orderModeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#666666",
  },
  orderModeTextActive: {
    color: "#FFFFFF",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FFFFFF",
  },

  /* ── Available Balance Row ── */
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availableLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  availableRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  availableAmount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  availableSymbol: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#666666",
  },
  maxButton: {
    fontSize: 12,
    fontWeight: "500",
    color: "#E26B1D",
    marginLeft: 4,
  },

  /* ── Pill Input (label + value stacked inside rounded card) ── */
  pillInput: {
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 2,
  },
  pillInputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pillInputLabel: {
    fontSize: 10,
    lineHeight: 15,
    color: "#666666",
  },
  pillInputUnit: {
    fontSize: 10,
    lineHeight: 15,
    color: "#666666",
  },
  pillInputField: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#FFFFFF",
    padding: 0,
    marginTop: 2,
  },

  /* ── Percentage Steps ── */
  sliderStepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  sliderStep: {
    flex: 1,
    paddingVertical: 4,
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 6,
  },
  sliderStepText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    color: "#666666",
  },

  /* ── Submit Button ── */
  orderButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  orderButtonBuy: {
    backgroundColor: "#E26B1D",
    // shadow glow  
    shadowColor: "#E26B1D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orderButtonSell: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orderButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* ── Order Book Sidebar ── */
  orderBookContainer: {
    width: 135,
    flexShrink: 0,
  },
});
