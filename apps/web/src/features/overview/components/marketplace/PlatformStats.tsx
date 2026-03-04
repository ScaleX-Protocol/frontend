"use client";

import { BarChart3, Activity, TrendingUp, Layers } from "lucide-react";
import type { Market, Ticker24hr } from "@scalex/types";

interface PlatformStatsProps {
  markets: Market[];
  tickers: Record<string, Ticker24hr>;
  isLoading: boolean;
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
    <div className="bg-[#0C0C0C] rounded-2xl p-6 border border-[#1F1F1F] animate-pulse">
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
    <div className="bg-[#0C0C0C] rounded-2xl p-6 border border-[#1F1F1F] hover:border-[#333333] transition-colors">
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

  const stats = [
    {
      label: "24h Volume",
      value: formatNumber(totalVolume),
      icon: <BarChart3 size={20} className="text-[#FFFFFF]" />,
    },
    {
      label: "Total Liquidity",
      value: formatNumber(totalLiquidity),
      icon: <Layers size={20} className="text-[#FFFFFF]" />,
    },
    {
      label: "Active Markets",
      value: totalMarkets.toString(),
      icon: <Activity size={20} className="text-[#FFFFFF]" />,
    },
    {
      label: "24h Trades",
      value: formatTradeCount(totalTrades),
      icon: <TrendingUp size={20} className="text-[#FFFFFF]" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
