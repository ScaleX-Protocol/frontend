"use client";

import { wagmiConfig } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { PrivyClientConfig, PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";
import { defineChain } from "viem";
import { mainnet, sepolia } from "wagmi/chains";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error?.message?.includes("429") ||
          error?.message?.includes("Too Many Requests")
        ) {
          return false;
        }

        if (
          error?.message?.includes("timeout") ||
          error?.message?.includes("ERR_TIMED_OUT")
        ) {
          return false;
        }

        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

const createPrivyConfig = (): PrivyClientConfig => {
  const baseConfig: PrivyClientConfig = {
    embeddedWallets: {
      ethereum: {
        createOnLogin: "all-users",
      },
      showWalletUIs: false,
    },
    loginMethods: ["wallet"],
    appearance: {
      theme: "dark",
      accentColor: "#676FFF",
      logo: "/images/logo/ScaleX.webp",
    },
  };

  return {
    ...baseConfig,
    defaultChain: defineChain(sepolia),
    supportedChains: [defineChain(mainnet), defineChain(sepolia)],
  };
};

const privyConfig = createPrivyConfig();

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
