import * as React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { usePrivy } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useWalletMobile } from "~/src/hooks/useWalletMobile";

interface AppHeaderProps {
  // Optional props for future extensibility
}

export function AppHeader(_props: AppHeaderProps) {
  const { isReady, user, logout } = usePrivy();
  const { login } = useLogin();
  const { walletAddress } = useWalletMobile();


  // Handle connect/disconnect button press
  const handleConnectPress = async () => {
    try {
      if (user) {
        // User is connected - show logout confirmation or direct logout
        await logout();
      } else {
        // User is not connected - show login modal
        login({
          loginMethods: ["email", "google", "twitter"],
        });
      }
    } catch (error) {
      console.error("[AppHeader] Error in handleConnectPress:", error);
    }
  };

  // Get button text based on connection state
  const getButtonText = () => {
    if (!isReady) return "Loading...";
    if (user) return walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-2)}` : "Connected";
    return "Connect Wallet";
  };

  // Get button style based on state
  const getButtonStyle = () => {
    if (!isReady) {
      return [styles.connectButton, styles.connectButtonDisabled];
    }
    if (user) {
      return [styles.connectButton, styles.connectedButton];
    }
    return styles.connectButton;
  };

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require("~/assets/images/ScaleX.webp")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logo}>ScaleX</Text>
      </View>

      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handleConnectPress}
        disabled={!isReady}
        activeOpacity={0.8}
      >
        {user && <View style={styles.statusDot} />}
        <Text
          style={[styles.connectButtonText, user && styles.connectedButtonText]}
        >
          {getButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  logoContainer: {
    flex: 1,
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
  connectButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connectButtonDisabled: {
    backgroundColor: "#666666",
    opacity: 0.5,
  },
  connectedButton: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333333",
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  connectedButtonText: {
    color: "#E0E0E0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F06718",
  },
});
