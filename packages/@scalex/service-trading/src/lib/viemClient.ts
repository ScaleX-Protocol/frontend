// Viem client for service-trading
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

export function createInterceptedWalletClient() {
  // Placeholder for intercepted wallet client
  return null;
}