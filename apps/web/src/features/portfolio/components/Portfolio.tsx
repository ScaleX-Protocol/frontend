"use client";

import { lazy, Suspense, useMemo, useState } from "react";
import { useWalletState } from "@/hooks/useWalletState";
import { ChainConfig } from "@/configs/chain";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useLendingDashboard } from "@scalex/service-lending";
import { useViewMode } from "@/hooks/ui/useViewMode";
import { useLogger } from "@/hooks/useLogger";
import { LogLevel, LogLabel, ServiceName } from "@/utils/logger";

// Lazy load view components for performance
const PortfolioDesktop = lazy(() => import("./PortfolioDesktop"));
const PortfolioMobile = lazy(() => import("./PortfolioMobile"));

// Loading skeleton while view loads
function ViewLoadingSkeleton() {
  return (
    <div className="w-full flex-1 p-5 md:p-8 flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-[#1A1A1A] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 h-48 bg-[#1A1A1A] rounded-[32px]" />
        <div className="h-48 bg-[#1A1A1A] rounded-[32px]" />
      </div>
    </div>
  );
}

export interface UseCurrenciesParams {
  chainId: number;
  onlyActual?: boolean;
  limit?: number;
}

type TimePeriod = "24h" | "Week" | "Month";

/**
 * Smart Portfolio component that switches between desktop/mobile views
 * Uses React.lazy for lazy loading
 */
export default function Portfolio() {
  const viewMode = useViewMode();
  const wallet = useWalletState();
  const logger = useLogger();

  // Always use configured chainId from environment, not wallet's chainId
  const chainId = ChainConfig.defaultChainId;
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("24h");

  // Get the active wallet address - prefer embedded wallet, fallback to external
  const activeWalletAddress =
    wallet.embeddedWallet.address !== "Not Created"
      ? wallet.embeddedWallet.address
      : wallet.externalWallet.address;

  // Query is enabled if we have any valid wallet address
  const isWalletConnected =
    activeWalletAddress !== "Not Created" &&
    activeWalletAddress !== "Not Connected";

  // Debug logging
  logger.log(
    LogLevel.DEBUG,
    "Portfolio render",
    LogLabel.USER,
    ServiceName.WEBAPP,
    {
      viewMode,
      activeWallet: activeWalletAddress,
      isConnected: isWalletConnected,
      chainId,
    },
    "Portfolio.tsx",
    "Portfolio"
  );

  const {
    data: lendingData,
    isLoading,
    error,
    refetch: refetchLendingData,
  } = useLendingDashboard(
    {
      user: activeWalletAddress,
      chainId: chainId,
    },
    {
      enabled: isWalletConnected,
    }
  );

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } =
    useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  // Shared props for both views
  const sharedProps = {
    lendingData,
    isLoading,
    error,
    refetchLendingData,
    currencies: availableCurrencies,
    currenciesLoading,
  };

  // Render appropriate view based on viewport
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      {viewMode === "mobile" ? (
        <PortfolioMobile {...sharedProps} />
      ) : (
        <PortfolioDesktop
          {...sharedProps}
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
        />
      )}
    </Suspense>
  );
}
