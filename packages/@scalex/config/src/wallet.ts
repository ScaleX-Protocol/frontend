import { baseSepolia } from "viem/chains";

export const PRIVY_CONFIG = {
  appId: process.env.VITE_PRIVY_APP_ID || process.env.EXPO_PUBLIC_PRIVY_APP_ID,
  // EVM Side
  supportedChains: [baseSepolia], // Import dari viem/chains
  // SVM Side
  solanaClusters: [
    { name: 'devnet', endpoint: 'https://api.devnet.solana.com' }
  ],
};