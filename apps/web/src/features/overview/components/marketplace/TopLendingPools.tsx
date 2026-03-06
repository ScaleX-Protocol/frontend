"use client";

import { Landmark, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { LendingPoolStat } from "@/features/lending/types/lending.types";
import TokenIcon from "@/components/common/TokenIcon";

interface TopLendingPoolsProps {
  pools: LendingPoolStat[];
  isLoading: boolean;
}

function PoolCardSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-32 bg-[#1A1A1A] rounded" />
          <div className="h-3 w-24 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]" />
              <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
            </div>
            <div className="h-4 w-14 bg-[#1A1A1A] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopLendingPools({ pools, isLoading }: TopLendingPoolsProps) {
  const topPools = pools.slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Landmark size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">Top Lending Pools</span>
            <span className="text-[#666666] text-sm">Highest earning opportunities</span>
          </div>
        </div>
        <Link
          to="/lending"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Pool Card */}
      {isLoading ? (
        <PoolCardSkeleton />
      ) : topPools.length === 0 ? (
        <div className="bg-[#0C0C0C] rounded-2xl p-8 border border-[#1F1F1F] text-center">
          <Landmark size={32} className="text-[#333333] mx-auto mb-3" />
          <p className="text-[#666666] text-sm mb-3">No lending pools available</p>
          <Link
            to="/lending"
            className="text-[#F06718] text-sm font-medium hover:underline"
          >
            View Lending
          </Link>
        </div>
      ) : (
        <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] hover:border-[#333333] transition-colors">
          <div className="flex flex-col gap-1">
            {/* Column headers */}
            <div className="flex items-center justify-between px-3 pb-2 border-b border-[#1F1F1F]">
              <span className="text-[#606060] text-xs font-medium">Asset</span>
              <div className="flex items-center gap-6">
                <span className="text-[#606060] text-xs font-medium w-16 text-right">Supply APY</span>
                <span className="text-[#606060] text-xs font-medium w-16 text-right">Borrow APY</span>
                <span className="text-[#606060] text-xs font-medium w-20 text-right">Utilization</span>
              </div>
            </div>

            {topPools.map((pool, index) => (
              <Link
                key={pool.token}
                to="/lending"
                className="flex items-center justify-between py-2.5 px-3 -mx-0 rounded-xl hover:bg-[#111111] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TokenIcon symbol={pool.symbol} size="sm" />
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F06718] flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white">1</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[#FFFFFF] text-sm font-medium">{pool.symbol}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[#4CAF50] text-sm font-bold w-16 text-right">
                    {pool.supplyRate.toFixed(2)}%
                  </span>
                  <span className="text-[#FF9800] text-sm font-medium w-16 text-right">
                    {pool.borrowRate.toFixed(2)}%
                  </span>
                  <div className="w-20 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F06718] rounded-full"
                        style={{ width: `${Math.min(pool.utilizationRate * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[#888888] text-xs w-9 text-right">
                      {(pool.utilizationRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <Link
            to="/lending"
            className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-[#1F1F1F] text-sm font-medium text-[#888888] hover:text-[#FFFFFF] transition-colors"
          >
            View All Pools <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
