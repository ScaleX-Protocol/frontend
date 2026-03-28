"use client";

import { BarChart3, Activity, TrendingUp, Layers, Vault, ArrowDownRight, Percent, Target } from "lucide-react";
import type { Market, Ticker24hr } from "@scalex/types";
import type { LendingStatsResponse } from "@/features/lending/types/lending.types";
import type { PredictionStatsResponse } from "@/features/predictions/types/prediction.types";

interface PlatformStatsProps {
  markets: Market[];
  tickers: Record<string, Ticker24hr>;
  isLoading: boolean;
  lendingStats?: LendingStatsResponse;
  lendingLoading?: boolean;
  predictionStats?: PredictionStatsResponse;
  predictionLoading?: boolean;
}

function formatNumber(value: number, includeSign = true): string {
  const sign = includeSign ? "$" : "";
  if (value >= 1_000_000_000) {
    return `${sign}${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${sign}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${sign}${(value / 1_000).toFixed(2)}K`;
  }
  return `${sign}${value.toFixed(2)}`;
}

function formatTradeCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function StatCardSkeleton() {
  return (
    <div className="min-w-[200px] flex-1 bg-[#0C0C0C] rounded-2xl p-6 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-20 bg-[#1A1A1A] rounded" />
        <div className="w-11 h-11 rounded-xl bg-[#1A1A1A]" />
      </div>
      <div className="h-9 w-32 bg-[#1A1A1A] rounded" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="min-w-[200px] flex-1 bg-[#0C0C0C] rounded-2xl p-6 border border-[#1F1F1F] hover:border-[#333333] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#888888] text-sm font-medium">{label}</span>
        <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <span className="text-[#FFFFFF] text-3xl font-bold">{value}</span>
    </div>
  );
}

export default function PlatformStats({
  markets = [],
  tickers = {},
  isLoading,
  lendingStats,
  lendingLoading = false,
  predictionStats,
  predictionLoading = false,
}: PlatformStatsProps) {
  // Calculate platform stats from markets data
  const totalVolume = (markets || []).reduce((acc, market) => {
    return acc + parseFloat(market.volumeInQuote || "0");
  }, 0);

  const totalLiquidity = (markets || []).reduce((acc, market) => {
    return acc + parseFloat(market.totalLiquidityInQuote || "0");
  }, 0);

  const totalMarkets = (markets || []).length;

  // Calculate 24h trades from ticker count field
  const totalTrades = Object.values(tickers).reduce((acc, ticker) => {
    return acc + (ticker?.count || 0);
  }, 0);

  // Lending stats values
  const totalSupplied = lendingStats ? parseFloat(lendingStats.totalSupply) / 1e18 : 0;
  const totalBorrowed = lendingStats ? parseFloat(lendingStats.totalBorrow) / 1e18 : 0;
  const bestAPY = lendingStats?.bestSupplyAPY ?? 0;

  // Prediction stats values
  const activePredictions = predictionStats?.activeMarkets ?? 0;

  const tradingStats = [
    {
      label: "24h Volume",
      value: formatNumber(totalVolume),
      icon: <BarChart3 size={20} className="text-[#FFFFFF]" />,
      loading: isLoading,
    },
    {
      label: "Total Liquidity",
      value: formatNumber(totalLiquidity),
      icon: <Layers size={20} className="text-[#FFFFFF]" />,
      loading: isLoading,
    },
    {
      label: "Active Markets",
      value: totalMarkets.toString(),
      icon: <Activity size={20} className="text-[#FFFFFF]" />,
      loading: isLoading,
    },
    {
      label: "24h Trades",
      value: formatTradeCount(totalTrades),
      icon: <TrendingUp size={20} className="text-[#FFFFFF]" />,
      loading: isLoading,
    },
  ];

  const lendingStatsCards = [
    {
      label: "Total Supplied",
      value: formatNumber(totalSupplied),
      icon: <Vault size={20} className="text-[#FFFFFF]" />,
      loading: lendingLoading,
    },
    {
      label: "Total Borrowed",
      value: formatNumber(totalBorrowed),
      icon: <ArrowDownRight size={20} className="text-[#FFFFFF]" />,
      loading: lendingLoading,
    },
    {
      label: "Best Supply APY",
      value: `${bestAPY.toFixed(2)}%`,
      icon: <Percent size={20} className="text-[#FFFFFF]" />,
      loading: lendingLoading,
    },
  ];

  const predictionStatsCards = [
    {
      label: "Active Predictions",
      value: activePredictions.toString(),
      icon: <Target size={20} className="text-[#FFFFFF]" />,
      loading: predictionLoading,
    },
  ];

  const allStats = [...tradingStats, ...lendingStatsCards, ...predictionStatsCards];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {allStats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          isLoading={stat.loading}
        />
      ))}
    </div>
  );
}
