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

export function getViemChain() {
  return baseSepolia;
}

export function waitForTransactionWithLogging(hash: `0x${string}`) {
  return viemClient.waitForTransactionReceipt({ hash });
}