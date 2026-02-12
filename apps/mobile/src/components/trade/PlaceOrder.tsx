import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import OrderBook from "./OrderBook";

interface PlaceOrderProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  baseDecimals: number;
  quoteDecimals: number;
  currentPrice: string;
  onRefresh?: () => void;
}

export default function PlaceOrder({
  symbol,
  baseAsset,
  quoteAsset,
  baseDecimals,
  quoteDecimals,
  currentPrice,
  onRefresh,
}: PlaceOrderProps) {
  const [buySell, setBuySell] = useState<"buy" | "sell">("buy");
  const [activeTab, setActiveTab] = useState<"limit" | "market">("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  // TODO: Get actual balance from wallet
  const availableBalance = "0.00";
  const availableSymbol = buySell === "buy" ? quoteAsset : baseAsset;

  const handlePlaceOrder = () => {
    // TODO: Implement order placement
    console.log("Order placement:", { buySell, activeTab, amount, price });
  };

  return (
    <View style={styles.container}>
      {/* Buy/Sell Toggle */}
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

      {/* Side-by-side layout: PlaceOrder Form + OrderBook */}
      <View style={styles.sideBySideLayout}>
        {/* Left: Place Order Form */}
        <View style={styles.formContainer}>
          {/* Limit/Market Tabs + Available Balance */}
          <View style={styles.tabsAndBalance}>
            <View style={styles.orderModeTabs}>
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
          </View>

          {/* Available Balance Row */}
          <View style={styles.availableRow}>
            <Text style={styles.availableLabel}>Available</Text>
            <View style={styles.availableValue}>
              <Text style={styles.availableAmount}>{availableBalance}</Text>
              <Text style={styles.availableSymbol}>{availableSymbol}</Text>
              <TouchableOpacity>
                <Text style={styles.maxButton}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Input (Limit only) */}
          {activeTab === "limit" && (
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
                <Text style={styles.inputCurrency}>{quoteAsset}</Text>
              </View>
            </View>
          )}

          {/* Amount Input */}
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
              <Text style={styles.inputCurrency}>{baseAsset}</Text>
            </View>
          </View>

          {/* Place Order Button */}
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

        {/* Right: OrderBook */}
        <View style={styles.orderBookContainer}>
          <OrderBook
            symbol={symbol}
            baseDecimals={baseDecimals}
            quoteDecimals={quoteDecimals}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "column",
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
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
  sideBySideLayout: {
    flexDirection: "row",
    gap: 24,
  },
  formContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    gap: 16,
  },
  tabsAndBalance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },
  orderModeTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderModeTab: {
    paddingBottom: 4,
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
  availableValue: {
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
  inputGroup: {
    flexDirection: "column",
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    padding: 0,
  },
  inputCurrency: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 8,
  },
  orderButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  orderButtonBuy: {
    backgroundColor: "#2ECC71",
  },
  orderButtonSell: {
    backgroundColor: "#EF4444",
  },
  orderButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderBookContainer: {
    width: 135,
    flexShrink: 0,
  },
});
