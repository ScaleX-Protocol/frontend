"use client";

import { useMemo } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PredictionMarket } from "@/features/predictions/types/prediction.types";
import { resolveToken, formatAmount, COLLATERAL_DECIMALS, getMarketTypeLabel } from "@/features/predictions/utils/tokens";

interface RecentlySettledProps {
  markets: PredictionMarket[];
  isLoading: boolean;
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SettledCardSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
        <div className="h-5 w-16 bg-[#1A1A1A] rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-[#1A1A1A] rounded" />
        <div className="h-3 w-24 bg-[#1A1A1A] rounded" />
      </div>
    </div>
  );
}

function SettledCard({ market }: { market: PredictionMarket }) {
  const token = resolveToken(market.baseToken);
  const typeLabels = getMarketTypeLabel(market.marketType);
  const totalPayout = formatAmount(
    (BigInt(market.totalUp) + BigInt(market.totalDown)).toString(),
    COLLATERAL_DECIMALS
  );

  const outcomeLabel = market.outcome ? typeLabels.up : typeLabels.down;
  const outcomeColor = market.outcome ? "text-[#4CAF50]" : "text-[#F44336]";
  const outcomeBg = market.outcome ? "bg-[#4CAF50]/10" : "bg-[#F44336]/10";

  return (
    <Link to="/predictions">
      <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] cursor-pointer hover:border-[#333333] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#FFFFFF] font-semibold text-sm">{token.symbol}</span>
            <span className="text-[#606060] text-xs">{typeLabels.label}</span>
          </div>
          <span className={`${outcomeColor} ${outcomeBg} text-xs font-medium px-2 py-0.5 rounded-full`}>
            {outcomeLabel} Won
          </span>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between">
          <span className="text-[#666666] text-xs">
            {formatTimeAgo(market.endTime)}
          </span>
          <span className="text-[#FFFFFF] text-xs font-medium">
            {totalPayout} IDRX pool
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RecentlySettled({ markets, isLoading }: RecentlySettledProps) {
  const settledMarkets = useMemo(() => {
    return [...markets]
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, 5);
  }, [markets]);

  return (
    <div className="flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Trophy size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">Recently Settled</span>
            <span className="text-[#666666] text-sm">Latest prediction outcomes</span>
          </div>
        </div>
        <Link
          to="/predictions"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SettledCardSkeleton key={i} />
          ))}
        </div>
      ) : settledMarkets.length === 0 ? (
        <div className="bg-[#0C0C0C] rounded-2xl p-8 border border-[#1F1F1F] text-center">
          <Trophy size={32} className="text-[#333333] mx-auto mb-3" />
          <p className="text-[#666666] text-sm">No settled predictions yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settledMarkets.map((market) => (
            <SettledCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
