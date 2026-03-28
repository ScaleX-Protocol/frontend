"use client";

import { TrendingUp, Zap, Droplets, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Market, Ticker24hr } from "@scalex/types";
import TokenIcon from "@/components/common/TokenIcon";

interface TopOpportunitiesProps {
  markets: Market[];
  tickers: Record<string, Ticker24hr>;
  isLoading: boolean;
}

interface OpportunityItem {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  value: string;
  subValue?: string;
  positive?: boolean;
}

interface OpportunityCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: OpportunityItem[];
  linkTo: string;
  linkLabel: string;
  isLoading: boolean;
}

function OpportunityCardSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] animate-pulse">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
          <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]" />
              <div className="h-4 w-20 bg-[#1A1A1A] rounded" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
              <div className="h-3 w-12 bg-[#1A1A1A] rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
        <div className="h-4 w-24 bg-[#1A1A1A] rounded mx-auto" />
      </div>
    </div>
  );
}

function OpportunityCard({
  title,
  subtitle,
  icon,
  items,
  linkTo,
  linkLabel,
  isLoading,
}: OpportunityCardProps) {
  if (isLoading) {
    return <OpportunityCardSkeleton />;
  }

  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-5 border border-[#1F1F1F] flex flex-col hover:border-[#333333] transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[#FFFFFF] font-semibold">{title}</span>
          <span className="text-[#666666] text-xs">{subtitle}</span>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1 flex-1">
        {items.length === 0 ? (
          <div className="py-6 text-center">
            <span className="text-[#666666] text-sm">No data yet</span>
          </div>
        ) : (
          items.map((item, index) => (
            <Link
              key={item.symbol}
              to="/trade/$pairId"
              params={{ pairId: item.symbol }}
              className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-[#111111] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <TokenIcon symbol={item.baseAsset} size="sm" />
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F06718] flex items-center justify-center">
                      <span className="text-[6px] font-bold text-white">1</span>
                    </div>
                  )}
                </div>
                <span className="text-[#FFFFFF] text-sm font-medium">
                  {item.baseAsset}/{item.quoteAsset}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-[#FFFFFF]">
                  {item.value}
                </span>
                {item.subValue && (
                  <span className="text-[#666666] text-xs">
                    {item.subValue}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer Link */}
      <Link
        to={linkTo}
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-[#1F1F1F] text-sm font-medium text-[#888888] hover:text-[#FFFFFF] transition-colors"
      >
        {linkLabel}
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

export default function TopOpportunities({
  markets = [],
  tickers = {},
  isLoading,
}: TopOpportunitiesProps) {
  // Top gainers - markets with highest positive price change
  const topGainers = [...(markets || [])]
    .map((market) => ({
      ...market,
      changePercent: parseFloat(
        tickers[market.symbol]?.priceChangePercent || "0"
      ),
    }))
    .filter((m) => m.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)
    .map((m) => ({
      symbol: m.symbol,
      baseAsset: m.baseAsset,
      quoteAsset: m.quoteAsset,
      value: `+${m.changePercent.toFixed(2)}%`,
      subValue: `$${parseFloat(
        tickers[m.symbol]?.lastPrice || m.latestPrice || "0"
      ).toFixed(2)}`,
      positive: true,
    }));

  // Highest volume - markets with most trading activity
  const highestVolume = [...(markets || [])]
    .sort(
      (a, b) =>
        parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
    )
    .slice(0, 3)
    .map((m) => {
      const vol = parseFloat(m.volumeInQuote || "0");
      return {
        symbol: m.symbol,
        baseAsset: m.baseAsset,
        quoteAsset: m.quoteAsset,
        value:
          vol >= 1_000_000
            ? `$${(vol / 1_000_000).toFixed(2)}M`
            : `$${(vol / 1_000).toFixed(1)}K`,
        subValue: "24h volume",
        positive: true,
      };
    });

  // Most liquid - markets with highest liquidity
  const mostLiquid = [...(markets || [])]
    .sort(
      (a, b) =>
        parseFloat(b.totalLiquidityInQuote || "0") -
        parseFloat(a.totalLiquidityInQuote || "0")
    )
    .slice(0, 3)
    .map((m) => {
      const liq = parseFloat(m.totalLiquidityInQuote || "0");
      return {
        symbol: m.symbol,
        baseAsset: m.baseAsset,
        quoteAsset: m.quoteAsset,
        value:
          liq >= 1_000_000
            ? `$${(liq / 1_000_000).toFixed(2)}M`
            : `$${(liq / 1_000).toFixed(1)}K`,
        subValue: "liquidity",
        positive: true,
      };
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <OpportunityCard
        title="Top Gainers"
        subtitle="Biggest movers today"
        icon={<TrendingUp size={22} className="text-[#FFFFFF]" />}
        items={topGainers}
        linkTo="/trade"
        linkLabel="See All Gainers"
        isLoading={isLoading}
      />
      <OpportunityCard
        title="Highest Volume"
        subtitle="Most active markets"
        icon={<Zap size={22} className="text-[#FFFFFF]" />}
        items={highestVolume}
        linkTo="/trade"
        linkLabel="See All Markets"
        isLoading={isLoading}
      />
      <OpportunityCard
        title="Most Liquid"
        subtitle="Deep liquidity pools"
        icon={<Droplets size={22} className="text-[#FFFFFF]" />}
        items={mostLiquid}
        linkTo="/trade"
        linkLabel="See All Markets"
        isLoading={isLoading}
      />
    </div>
  );
}
