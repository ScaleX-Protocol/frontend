"use client";

import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Market, Ticker24hr } from "@scalex/types";
import TokenIcon from "@/components/common/TokenIcon";

interface TrendingMarketsProps {
  markets: Market[];
  tickers: Record<string, Ticker24hr>;
  isLoading: boolean;
}

function TrendingCard({
  market,
  ticker,
  rank,
}: {
  market: Market;
  ticker?: Ticker24hr;
  rank: number;
}) {
  const priceChangePercent = parseFloat(ticker?.priceChangePercent || "0");
  const isPositive = priceChangePercent >= 0;
  const price = ticker?.lastPrice || market.latestPrice || "0";
  const volume = parseFloat(market.volumeInQuote || "0");

  return (
    <Link to="/trade/$pairId" params={{ pairId: market.symbol }}>
      <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] cursor-pointer hover:border-[#333333] transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <TokenIcon symbol={market.baseAsset} size="lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-[#FFFFFF] border-2 border-[#0C0C0C]">
                {rank}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[#FFFFFF] font-semibold text-sm">
                {market.baseAsset}/{market.quoteAsset}
              </span>
              <span className="text-[#666666] text-xs">
                Vol: $
                {volume >= 1000
                  ? `${(volume / 1000).toFixed(1)}K`
                  : volume.toFixed(2)}
              </span>
            </div>
          </div>
          {rank <= 3 && (
            <div className="px-2 py-0.5 rounded-full bg-[#F06718]/10 border border-[#F06718]/20">
              <span className="text-[10px] font-bold text-[#F06718]">HOT</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-bold text-xl">
              $
              {parseFloat(price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </span>
            <div
              className={`flex items-center gap-1 ${
                isPositive ? "text-[#F06718]" : "text-[#888888]"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span className="text-sm font-semibold">
                {isPositive ? "+" : ""}
                {priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A]" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-20 bg-[#1A1A1A] rounded" />
            <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-24 bg-[#1A1A1A] rounded" />
          <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
        </div>
      </div>
    </div>
  );
}

export default function TrendingMarkets({
  markets = [],
  tickers = {},
  isLoading,
}: TrendingMarketsProps) {
  // Sort markets by volume and get top 6
  const trendingMarkets = [...(markets || [])]
    .sort(
      (a, b) =>
        parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
    )
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <TrendingUp size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">
              Trending Markets
            </span>
            <span className="text-[#666666] text-sm">Hot pairs by volume</span>
          </div>
        </div>
        <Link
          to="/trade"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingMarkets.map((market, index) => (
            <TrendingCard
              key={market.symbol}
              market={market}
              ticker={tickers[market.symbol]}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
