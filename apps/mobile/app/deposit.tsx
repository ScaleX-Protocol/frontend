import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react-native";
import { useDepositMobile, DepositStep } from "../src/hooks/useDepositMobile";
import { useWalletMobile } from "../src/hooks/useWalletMobile";

// Token configuration (Base Sepolia testnet)
const TOKENS = {
  USDC: {
    symbol: "USDC",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    address: "0xf08A50178dfcDe18524640EA6618a1f965821715" as `0x${string}`,
    decimals: 6,
  },
  // Add more tokens as needed
};

export default function DepositPage() {
  const [amount, setAmount] = React.useState("");
  const [selectedTokenSymbol, setSelectedTokenSymbol] =
    React.useState<keyof typeof TOKENS>("USDC");
  const [showTokenDropdown, setShowTokenDropdown] = React.useState(false);

  const { isWalletConnected, walletAddress } = useWalletMobile();

  const { deposit, isPending, currentStep, error, hash } = useDepositMobile({
    onSuccess: (txHash) => {
      console.log("[Deposit] Success! Hash:", txHash);
      Alert.alert(
        "Deposit Successful!",
        `Transaction confirmed: ${txHash.slice(0, 10)}...`,
        [
          {
            text: "View on BaseScan",
            onPress: () => {
              // Could open browser to basescan
              console.log("Open BaseScan:", txHash);
            },
          },
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ],
      );
    },
    onError: (err) => {
      console.error("[Deposit] Error:", err);
      Alert.alert("Deposit Failed", err.message);
    },
  });

  const selectedToken = TOKENS[selectedTokenSymbol];
  const availableTokens = Object.keys(TOKENS) as Array<keyof typeof TOKENS>;

  // For demo purposes - hardcoded balance
  // TODO: Fetch real balance using viem readContract
  const availableBalance = "1,234.56";

  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(availableBalance.replace(/,/g, ""));
    const newAmount = ((balance * percentage) / 100).toFixed(2);
    setAmount(newAmount);
  };

  const handleDeposit = async () => {
    if (!isWalletConnected || !walletAddress) {
      Alert.alert("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    try {
      await deposit({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
      });
    } catch (err) {
      // Error already handled in onError callback
      console.error("Deposit error:", err);
    }
  };

  // Status message based on current step
  const getStatusMessage = () => {
    switch (currentStep) {
      case DepositStep.VALIDATING:
        return "Validating transaction...";
      case DepositStep.APPROVING:
        return "Approving token... Please confirm in your wallet";
      case DepositStep.DEPOSITING:
        return "Processing deposit... Please confirm in your wallet";
      case DepositStep.CONFIRMING:
        return "Waiting for transaction confirmation...";
      case DepositStep.COMPLETED:
        return "Deposit completed successfully!";
      case DepositStep.ERROR:
        return error?.message || "An error occurred";
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();
  const isButtonDisabled = !amount || isPending || !isWalletConnected;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isPending}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Asset</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isPending}
      >
        {/* Wallet Status */}
        {!isWalletConnected && (
          <View style={[styles.infoCard, styles.warningCard]}>
            <AlertCircle size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              Please connect your wallet to deposit
            </Text>
          </View>
        )}

        {/* Token Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Asset</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() =>
              !isPending && setShowTokenDropdown(!showTokenDropdown)
            }
            disabled={isPending}
          >
            <Text style={styles.dropdownText}>{selectedTokenSymbol}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          {showTokenDropdown && (
            <View style={styles.dropdownMenu}>
              {availableTokens.map((tokenSymbol) => (
                <TouchableOpacity
                  key={tokenSymbol}
                  style={[
                    styles.dropdownItem,
                    tokenSymbol === selectedTokenSymbol &&
                      styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedTokenSymbol(tokenSymbol);
                    setShowTokenDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      tokenSymbol === selectedTokenSymbol &&
                        styles.dropdownItemTextActive,
                    ]}
                  >
                    {tokenSymbol}
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
              Available: {availableBalance} {selectedTokenSymbol}
            </Text>
          </View>
          <TextInput
            style={[styles.input, isPending && styles.inputDisabled]}
            placeholder="0.00"
            placeholderTextColor="#666666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!isPending}
          />

          {/* Percentage Buttons */}
          <View style={styles.percentageButtons}>
            {[25, 50, 75].map((percent) => (
              <TouchableOpacity
                key={percent}
                style={styles.percentButton}
                onPress={() => handlePercentageClick(percent)}
                disabled={isPending}
              >
                <Text style={styles.percentButtonText}>{percent}%</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => handlePercentageClick(100)}
              disabled={isPending}
            >
              <Text style={styles.percentButtonText}>Max</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Messages */}
        {statusMessage && (
          <View
            style={[
              styles.statusCard,
              currentStep === DepositStep.ERROR && styles.errorCard,
              currentStep === DepositStep.COMPLETED && styles.successCard,
            ]}
          >
            {isPending && currentStep !== DepositStep.ERROR && (
              <ActivityIndicator
                size="small"
                color="#F06718"
                style={{ marginRight: 8 }}
              />
            )}
            {currentStep === DepositStep.COMPLETED && (
              <CheckCircle
                size={16}
                color="#10B981"
                style={{ marginRight: 8 }}
              />
            )}
            {currentStep === DepositStep.ERROR && (
              <AlertCircle
                size={16}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={[
                styles.statusText,
                currentStep === DepositStep.ERROR && styles.errorText,
                currentStep === DepositStep.COMPLETED && styles.successText,
              ]}
            >
              {statusMessage}
            </Text>
          </View>
        )}

        {/* Transaction Hash */}
        {hash && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Transaction Hash:</Text>
            <Text style={styles.hashText}>
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </Text>
          </View>
        )}

        {/* Deposit Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Depositing assets will transfer them from your wallet to the lending
            protocol. You can withdraw anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.depositButton,
            isButtonDisabled && styles.depositButtonDisabled,
          ]}
          disabled={isButtonDisabled}
          onPress={handleDeposit}
        >
          {isPending ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.depositButtonText}>
                {currentStep === DepositStep.APPROVING
                  ? "Approving..."
                  : "Processing..."}
              </Text>
            </View>
          ) : (
            <Text style={styles.depositButtonText}>Deposit</Text>
          )}
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
  inputDisabled: {
    opacity: 0.6,
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
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  warningText: {
    fontSize: 12,
    color: "#F59E0B",
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#A0A0A0",
  },
  infoLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  hashText: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#E0E0E0",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(240, 103, 24, 0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusText: {
    fontSize: 13,
    color: "#F06718",
    flex: 1,
  },
  successText: {
    color: "#10B981",
  },
  errorText: {
    color: "#EF4444",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  depositButton: {
    backgroundColor: "#F06718",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  depositButtonDisabled: {
    opacity: 0.5,
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
