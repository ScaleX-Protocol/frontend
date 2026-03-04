"use client";

import { useMemo } from "react";
import { useMarkets } from "@scalex/service-trading";
import { useTickerAll } from "@/hooks/useTickerAll";
import type { Ticker24hr } from "@scalex/types";
import PlatformStats from "./marketplace/PlatformStats";
import TrendingMarkets from "./marketplace/TrendingMarkets";
import TopOpportunities from "./marketplace/TopOpportunities";
import TopAgentsSpotlight from "./marketplace/TopAgentsSpotlight";
import Leaderboards from "./marketplace/Leaderboards";
import MarketsTable from "./marketplace/MarketsTable";

/**
 * New marketplace-style Overview page
 * Shows platform stats, trending markets, and all available markets
 */
export default function OverviewNew() {
  const { data: markets = [], isLoading: marketsLoading } = useMarkets();
  const { data: tickersData, isLoading: tickersLoading } = useTickerAll();

  // Ensure tickersArray is always an array
  const tickersArray = Array.isArray(tickersData) ? tickersData : [];

  // Convert tickers array to a map for easy lookup
  const tickers = useMemo(() => {
    return tickersArray.reduce<Record<string, Ticker24hr>>((acc, ticker) => {
      if (ticker?.symbol) {
        acc[ticker.symbol] = ticker;
      }
      return acc;
    }, {});
  }, [tickersArray]);

  const isLoading = marketsLoading || tickersLoading;

  return (
    <div className="w-full flex-1 p-6 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl md:text-3xl text-[#FFFFFF]">
          Overview
        </h1>
        <p className="text-[#666666] text-sm md:text-base">
          Explore markets, discover opportunities, and start trading.
        </p>
      </div>

      {/* Platform Stats */}
      <PlatformStats
        markets={markets}
        tickers={tickers}
        isLoading={isLoading}
      />

      {/* Trending Markets */}
      <TrendingMarkets
        markets={markets}
        tickers={tickers}
        isLoading={isLoading}
      />

      {/* Top Opportunities */}
      <TopOpportunities
        markets={markets}
        tickers={tickers}
        isLoading={isLoading}
      />

      {/* Top Performing Agents Spotlight */}
      <TopAgentsSpotlight />

      {/* Leaderboards - Top Traders & Agents */}
      <Leaderboards />

      {/* All Markets Table */}
      <MarketsTable markets={markets} tickers={tickers} isLoading={isLoading} />

      {/* Footer */}
      <div className="flex justify-center items-center py-4">
        <span className="text-[#666666] text-xs">
          v{import.meta.env.VITE_APP_ENV || "1.0.1"} - Base Sepolia (Chain ID:
          84532)
        </span>
      </div>
    </div>
  );
}
