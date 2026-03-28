"use client";

import { useMemo, useState } from "react";
import { Search, TrendingUp, ChevronRight, Star, Target, Landmark } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMarkets } from "@scalex/service-trading";
import { useTickerAll } from "@/hooks/useTickerAll";
import type { Ticker24hr } from "@scalex/types";
import TokenIcon from "@/components/common/TokenIcon";
import { useLendingStats } from "@/features/lending/hooks/useLendingStats";
import { usePredictionStats } from "@/features/predictions/hooks/usePredictionStats";
import { usePredictionMarkets } from "@/features/predictions/hooks/usePredictionMarkets";
import { MarketStatus } from "@/features/predictions/types/prediction.types";
import CountdownTimer from "@/features/predictions/components/CountdownTimer";
import { formatAmount, computePoolPcts, getMarketTypeLabel, COLLATERAL_DECIMALS } from "@/features/predictions/utils/tokens";
import { useTokenMap } from "@/features/predictions/hooks/useTokenMap";
import TopAgentsSpotlightMobile from "./marketplace/TopAgentsSpotlightMobile";
import LeaderboardsMobile from "./marketplace/LeaderboardsMobile";

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-[#0C0C0C] rounded-[16px] p-4 border border-[#1F1F1F] flex flex-col gap-1">
      <span className="text-[#666666] text-xs font-medium">{label}</span>
      {isLoading ? (
        <div className="h-6 w-20 bg-[#1A1A1A] rounded animate-pulse" />
      ) : (
        <span className="text-[#FFFFFF] text-lg font-bold">{value}</span>
      )}
    </div>
  );
}

function TrendingMarketCard({
  symbol,
  baseAsset,
  quoteAsset,
  price,
  changePercent,
  volume,
}: {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  changePercent: number;
  volume: string;
}) {
  const isPositive = changePercent >= 0;

  return (
    <Link
      to="/trade/$pairId"
      params={{ pairId: symbol }}
      className="bg-[#0C0C0C] rounded-[16px] p-4 border border-[#1F1F1F] flex items-center justify-between min-w-[200px] hover:border-[#333333] transition-colors"
    >
      <div className="flex items-center gap-3">
        <TokenIcon symbol={baseAsset} size="md" />
        <div className="flex flex-col">
          <span className="text-[#FFFFFF] font-semibold text-sm">
            {baseAsset}/{quoteAsset}
          </span>
          <span className="text-[#666666] text-xs">Vol: {volume}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[#FFFFFF] font-medium text-sm">${price}</span>
        <span
          className={`text-xs font-medium ${
            isPositive ? "text-[#F06718]" : "text-[#888888]"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}

function MarketListItem({
  symbol,
  baseAsset,
  quoteAsset,
  price,
  changePercent,
}: {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  changePercent: number;
}) {
  const isPositive = changePercent >= 0;

  return (
    <Link
      to="/trade/$pairId"
      params={{ pairId: symbol }}
      className="flex items-center justify-between py-3 px-4 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#0F0F0F] transition-colors"
    >
      <div className="flex items-center gap-3">
        <button type="button" className="text-[#444444]">
          <Star size={14} />
        </button>
        <TokenIcon symbol={baseAsset} size="md" />
        <div className="flex flex-col">
          <span className="text-[#FFFFFF] font-medium text-sm">
            {baseAsset}/{quoteAsset}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[#FFFFFF] font-medium text-sm">${price}</span>
        <span
          className={`text-xs font-medium ${
            isPositive ? "text-[#F06718]" : "text-[#888888]"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}

/**
 * Mobile-optimized Overview page with marketplace layout
 */
export default function OverviewMobile() {
  const resolveToken = useTokenMap();
  const { data: markets = [], isLoading: marketsLoading } = useMarkets();
  const { data: tickersData, isLoading: tickersLoading } = useTickerAll();
  const [searchQuery, setSearchQuery] = useState("");

  // Lending & prediction data
  const { data: lendingStats, isLoading: lendingLoading } = useLendingStats();
  const { data: predictionStats, isLoading: predictionLoading } = usePredictionStats();
  const { data: activeMarketsData, isLoading: activeMarketsLoading } = usePredictionMarkets({
    status: MarketStatus.Open,
    limit: 6,
  });

  // Ensure tickersArray is always an array
  const tickersArray = Array.isArray(tickersData) ? tickersData : [];

  const tickers = useMemo(() => {
    return tickersArray.reduce<Record<string, Ticker24hr>>((acc, ticker) => {
      if (ticker?.symbol) {
        acc[ticker.symbol] = ticker;
      }
      return acc;
    }, {});
  }, [tickersArray]);

  const isLoading = marketsLoading || tickersLoading;

  // Calculate stats
  const totalVolume = markets.reduce(
    (acc, m) => acc + parseFloat(m.volumeInQuote || "0"),
    0
  );
  const totalLiquidity = markets.reduce(
    (acc, m) => acc + parseFloat(m.totalLiquidityInQuote || "0"),
    0
  );

  // Lending stats values
  const totalSupplied = lendingStats ? parseFloat(lendingStats.totalSupply) / 1e18 : 0;
  const activePredictions = predictionStats?.activeMarkets ?? 0;

  // Trending markets (top 4 by volume)
  const trendingMarkets = [...markets]
    .sort(
      (a, b) =>
        parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
    )
    .slice(0, 4);

  // Active prediction markets
  const activePredictionMarkets = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return (activeMarketsData?.markets ?? [])
      .filter((m) => m.status === MarketStatus.Open && m.endTime > now)
      .slice(0, 4);
  }, [activeMarketsData]);

  // Top lending pools (3 for mobile)
  const topPools = lendingStats?.pools?.slice(0, 3) ?? [];

  // Filter markets by search
  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return markets;
    const query = searchQuery.toLowerCase();
    return markets.filter(
      (m) =>
        m.baseAsset.toLowerCase().includes(query) ||
        m.quoteAsset.toLowerCase().includes(query) ||
        m.symbol.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

  // Sort filtered markets by volume
  const sortedMarkets = [...filteredMarkets].sort(
    (a, b) =>
      parseFloat(b.volumeInQuote || "0") - parseFloat(a.volumeInQuote || "0")
  );

  return (
    <div className="w-full flex-1 p-4 flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-xl text-[#FFFFFF]">Overview</h1>
        <p className="text-[#666666] text-sm">
          Explore markets, lending, and predictions
        </p>
      </div>

      {/* Quick Stats - expanded to 4 cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="24h Volume"
          value={formatNumber(totalVolume)}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Liquidity"
          value={formatNumber(totalLiquidity)}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Supplied"
          value={formatNumber(totalSupplied)}
          isLoading={lendingLoading}
        />
        <StatCard
          label="Active Predictions"
          value={activePredictions.toString()}
          isLoading={predictionLoading}
        />
      </div>

      {/* Trending Markets */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] font-semibold">Trending</span>
          </div>
          <Link
            to="/trade"
            className="text-[#F06718] text-sm font-medium flex items-center gap-0.5"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#0C0C0C] rounded-[16px] p-4 border border-[#1F1F1F] min-w-[200px] animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A]" />
                    <div className="flex flex-col gap-1">
                      <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
                      <div className="h-3 w-12 bg-[#1A1A1A] rounded" />
                    </div>
                  </div>
                </div>
              ))
            : trendingMarkets.map((market) => {
                const ticker = tickers[market.symbol];
                const vol = parseFloat(market.volumeInQuote || "0");
                return (
                  <TrendingMarketCard
                    key={market.symbol}
                    symbol={market.symbol}
                    baseAsset={market.baseAsset}
                    quoteAsset={market.quoteAsset}
                    price={parseFloat(
                      ticker?.lastPrice || market.latestPrice || "0"
                    ).toFixed(2)}
                    changePercent={parseFloat(
                      ticker?.priceChangePercent || "0"
                    )}
                    volume={
                      vol >= 1000
                        ? `$${(vol / 1000).toFixed(1)}K`
                        : `$${vol.toFixed(0)}`
                    }
                  />
                );
              })}
        </div>
      </div>

      {/* Active Predictions - horizontal scroll */}
      {(activeMarketsLoading || activePredictionMarkets.length > 0) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#FFFFFF]" />
              <span className="text-[#FFFFFF] font-semibold">Predictions</span>
            </div>
            <Link
              to="/predictions"
              className="text-[#F06718] text-sm font-medium flex items-center gap-0.5"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {activeMarketsLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#0C0C0C] rounded-[16px] p-4 border border-[#1F1F1F] min-w-[220px] animate-pulse"
                  >
                    <div className="h-4 w-20 bg-[#1A1A1A] rounded mb-3" />
                    <div className="h-2 w-full bg-[#1A1A1A] rounded mb-3" />
                    <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
                  </div>
                ))
              : activePredictionMarkets.map((market) => {
                  const token = resolveToken(market.baseToken);
                  const { upPct, downPct, totalPool } = computePoolPcts(market.totalUp, market.totalDown);
                  const typeLabels = getMarketTypeLabel(market.marketType);
                  const totalStake = formatAmount(totalPool.toString(), COLLATERAL_DECIMALS);

                  return (
                    <Link key={market.id} to="/predictions" className="min-w-[220px]">
                      <div className="bg-[#0C0C0C] rounded-[16px] p-4 border border-[#1F1F1F] hover:border-[#333333] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#FFFFFF] font-semibold text-sm">{token.symbol}</span>
                          <CountdownTimer endTime={market.endTime} status={market.status} compact />
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                          <div className="bg-[#4CAF50]" style={{ width: `${upPct}%` }} />
                          <div className="bg-[#F44336]" style={{ width: `${downPct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#4CAF50]">{typeLabels.up} {upPct}%</span>
                          <span className="text-[#888888]">{totalStake} IDRX</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      )}

      {/* Top Lending Pools - compact list */}
      {(lendingLoading || topPools.length > 0) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-[#FFFFFF]" />
              <span className="text-[#FFFFFF] font-semibold">Lending Pools</span>
            </div>
            <Link
              to="/lending"
              className="text-[#F06718] text-sm font-medium flex items-center gap-0.5"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="bg-[#0C0C0C] rounded-[16px] border border-[#1F1F1F] overflow-hidden">
            {lendingLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-4 border-b border-[#1A1A1A] animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#1A1A1A] rounded-full" />
                    <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
                  </div>
                  <div className="h-4 w-14 bg-[#1A1A1A] rounded" />
                </div>
              ))
            ) : (
              topPools.map((pool) => (
                <Link
                  key={pool.token}
                  to="/lending"
                  className="flex items-center justify-between py-3 px-4 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#0F0F0F] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={pool.symbol} size="md" />
                    <span className="text-[#FFFFFF] font-medium text-sm">{pool.symbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[#4CAF50] text-sm font-bold">{pool.supplyRate.toFixed(2)}%</span>
                      <span className="text-[#666666] text-[10px]">Supply APY</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Top Agents Spotlight */}
      <TopAgentsSpotlightMobile />

      {/* Leaderboards */}
      <LeaderboardsMobile />

      {/* All Markets */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[#FFFFFF] font-semibold">All Markets</span>
          <span className="text-[#666666] text-sm">
            {markets.length} markets
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
          />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#333333]"
          />
        </div>

        {/* Markets List */}
        <div className="bg-[#0C0C0C] rounded-[16px] border border-[#1F1F1F] overflow-hidden">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-4 border-b border-[#1A1A1A] animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#1A1A1A] rounded" />
                  <div className="w-7 h-7 bg-[#1A1A1A] rounded-full" />
                  <div className="h-4 w-20 bg-[#1A1A1A] rounded" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-4 w-16 bg-[#1A1A1A] rounded" />
                  <div className="h-3 w-12 bg-[#1A1A1A] rounded" />
                </div>
              </div>
            ))
          ) : sortedMarkets.length === 0 ? (
            <div className="py-8 text-center text-[#666666]">
              No markets found
            </div>
          ) : (
            sortedMarkets.map((market) => {
              const ticker = tickers[market.symbol];
              return (
                <MarketListItem
                  key={market.symbol}
                  symbol={market.symbol}
                  baseAsset={market.baseAsset}
                  quoteAsset={market.quoteAsset}
                  price={parseFloat(
                    ticker?.lastPrice || market.latestPrice || "0"
                  ).toFixed(2)}
                  changePercent={parseFloat(ticker?.priceChangePercent || "0")}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
