import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function WithdrawPage() {
  const [amount, setAmount] = React.useState("");
  const [selectedToken, setSelectedToken] = React.useState("gsUSDC");
  const [showTokenDropdown, setShowTokenDropdown] = React.useState(false);

  const availableTokens = ["gsUSDC", "gsUSDT", "gsDAI", "gsETH"];
  const availableBalance = "1,234.56";

  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(availableBalance.replace(/,/g, ""));
    const newAmount = ((balance * percentage) / 100).toFixed(2);
    setAmount(newAmount);
  };

  // Remove 'gs' prefix for display
  const getDisplayName = (token: string) => {
    return token.replace(/^gs/, "");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Asset</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Token Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Synthetic Asset to Withdraw</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowTokenDropdown(!showTokenDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedToken}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          {showTokenDropdown && (
            <View style={styles.dropdownMenu}>
              {availableTokens.map((token) => (
                <TouchableOpacity
                  key={token}
                  style={[
                    styles.dropdownItem,
                    token === selectedToken && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedToken(token);
                    setShowTokenDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      token === selectedToken && styles.dropdownItemTextActive,
                    ]}
                  >
                    {token}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.availableBalance}>
              Available to withdraw: {availableBalance}{" "}
              {getDisplayName(selectedToken)}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Percentage Buttons */}
          <View style={styles.percentageButtons}>
            {[25, 50, 75].map((percent) => (
              <TouchableOpacity
                key={percent}
                style={styles.percentButton}
                onPress={() => handlePercentageClick(percent)}
              >
                <Text style={styles.percentButtonText}>{percent}%</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => handlePercentageClick(100)}
            >
              <Text style={styles.percentButtonText}>Max</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Withdraw Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Synthetic Token Withdrawal:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Your tokens convert back to original asset
            </Text>
            <Text style={styles.infoItem}>
              • All earned interest included automatically
            </Text>
            <Text style={styles.infoItem}>
              • Sent directly to your connected wallet
            </Text>
            <Text style={styles.infoItem}>
              • Usually completes in 1-2 minutes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            !amount && styles.withdrawButtonDisabled,
          ]}
          disabled={!amount}
        >
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "500",
    color: "#A0A0A0",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  availableBalance: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: "#E0E0E0",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "rgba(224, 224, 224, 0.4)",
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.2)",
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: "#252525",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#E0E0E0",
  },
  dropdownItemTextActive: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#E0E0E0",
  },
  percentageButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  percentButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  percentButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#E0E0E0",
  },
  infoCard: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.1)",
    borderRadius: 10,
    padding: 12,
  },
  infoTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#A0A0A0",
    marginBottom: 8,
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 12,
    lineHeight: 16,
    color: "#A0A0A0",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  withdrawButton: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  withdrawButtonDisabled: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
