"use client";

import { useMemo } from "react";
import { Target, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PredictionMarket } from "@/features/predictions/types/prediction.types";
import { MarketStatus } from "@/features/predictions/types/prediction.types";
import CountdownTimer from "@/features/predictions/components/CountdownTimer";
import { resolveToken, formatAmount, computePoolPcts, getMarketTypeLabel, COLLATERAL_DECIMALS } from "@/features/predictions/utils/tokens";

interface ActivePredictionsProps {
  markets: PredictionMarket[];
  isLoading: boolean;
}

function PredictionCardSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
        <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
      </div>
      <div className="h-3 w-full bg-[#1A1A1A] rounded mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-[#1A1A1A] rounded" />
        <div className="h-3 w-20 bg-[#1A1A1A] rounded" />
      </div>
    </div>
  );
}

function PredictionCard({ market }: { market: PredictionMarket }) {
  const token = resolveToken(market.baseToken);
  const { upPct, downPct, totalPool } = computePoolPcts(market.totalUp, market.totalDown);
  const typeLabels = getMarketTypeLabel(market.marketType);
  const totalStake = formatAmount(totalPool.toString(), COLLATERAL_DECIMALS);

  return (
    <Link to="/predictions">
      <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] cursor-pointer hover:border-[#333333] transition-colors">
        {/* Header: token + countdown */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#FFFFFF] font-semibold text-sm">{token.symbol}</span>
            <span className="text-[#606060] text-xs">{typeLabels.label}</span>
          </div>
          <CountdownTimer endTime={market.endTime} status={market.status} compact />
        </div>

        {/* Pool bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-3">
          <div
            className="bg-[#4CAF50] transition-all"
            style={{ width: `${upPct}%` }}
          />
          <div
            className="bg-[#F44336] transition-all"
            style={{ width: `${downPct}%` }}
          />
        </div>

        {/* Stakes */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#4CAF50] font-medium">{typeLabels.up} {upPct}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#F44336] font-medium">{typeLabels.down} {downPct}%</span>
          </div>
        </div>

        {/* Total stake */}
        <div className="mt-3 pt-3 border-t border-[#1F1F1F] flex items-center justify-between">
          <span className="text-[#666666] text-xs">Total Staked</span>
          <span className="text-[#FFFFFF] text-xs font-medium">{totalStake} IDRX</span>
        </div>
      </div>
    </Link>
  );
}

export default function ActivePredictions({ markets, isLoading }: ActivePredictionsProps) {
  // Filter to only show markets that haven't ended yet
  const activeMarkets = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return markets
      .filter((m) => m.status === MarketStatus.Open && m.endTime > now)
      .sort((a, b) => {
        const totalA = BigInt(a.totalUp) + BigInt(a.totalDown);
        const totalB = BigInt(b.totalUp) + BigInt(b.totalDown);
        return totalB > totalA ? 1 : totalB < totalA ? -1 : 0;
      })
      .slice(0, 6);
  }, [markets]);

  return (
    <div className="flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Target size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">Active Predictions</span>
            <span className="text-[#666666] text-sm">Open prediction markets</span>
          </div>
        </div>
        <Link
          to="/predictions"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PredictionCardSkeleton key={i} />
          ))}
        </div>
      ) : activeMarkets.length === 0 ? (
        <div className="bg-[#0C0C0C] rounded-2xl p-8 border border-[#1F1F1F] text-center">
          <Target size={32} className="text-[#333333] mx-auto mb-3" />
          <p className="text-[#666666] text-sm mb-3">No active prediction markets</p>
          <Link
            to="/predictions"
            className="text-[#F06718] text-sm font-medium hover:underline"
          >
            View All Predictions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMarkets.map((market) => (
            <PredictionCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
