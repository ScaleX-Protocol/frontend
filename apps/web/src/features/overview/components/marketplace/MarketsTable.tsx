"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Market, Ticker24hr } from "@scalex/types";
import TokenIcon from "@/components/common/TokenIcon";

interface MarketsTableProps {
  markets: Market[];
  tickers: Record<string, Ticker24hr>;
  isLoading: boolean;
}

type SortField = "symbol" | "price" | "change" | "volume" | "liquidity";
type SortDirection = "asc" | "desc";

function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (num >= 1) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatVolume(volume: string | number): string {
  const num = typeof volume === "string" ? parseFloat(volume) : volume;
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#FFFFFF] ${
        isActive ? "text-[#FFFFFF]" : "text-[#666666]"
      } ${align === "right" ? "justify-end ml-auto" : ""}`}
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-50" />
      )}
    </button>
  );
}

function MarketRow({
  market,
  ticker,
}: {
  market: Market;
  ticker?: Ticker24hr;
}) {
  const priceChangePercent = parseFloat(ticker?.priceChangePercent || "0");
  const isPositive = priceChangePercent >= 0;
  const price = ticker?.lastPrice || market.latestPrice || "0";
  const volume = market.volumeInQuote || "0";
  const liquidity = market.totalLiquidityInQuote || "0";

  return (
    <Link
      to="/trade/$pairId"
      params={{ pairId: market.symbol }}
      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1A1A1A] cursor-pointer items-center hover:bg-[#111111] transition-colors"
    >
      {/* Market */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-[#333333] hover:text-[#F06718] transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <Star size={16} />
        </button>
        <div className="relative">
          <TokenIcon symbol={market.baseAsset} size="md" />
          <TokenIcon
            symbol={market.quoteAsset}
            size="xs"
            className="absolute -bottom-0.5 -right-0.5 border border-[#0C0C0C] rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[#FFFFFF] font-medium text-sm">
            {market.baseAsset}/{market.quoteAsset}
          </span>
          <span className="text-[#666666] text-xs">{market.baseAsset}</span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-[#FFFFFF] font-medium text-sm">
          ${formatPrice(price)}
        </span>
      </div>

      {/* 24h Change */}
      <div
        className={`text-right font-medium text-sm ${
          isPositive ? "text-[#F06718]" : "text-[#888888]"
        }`}
      >
        {isPositive ? "+" : ""}
        {priceChangePercent.toFixed(2)}%
      </div>

      {/* 24h Volume */}
      <div className="text-right">
        <span className="text-[#FFFFFF] text-sm">{formatVolume(volume)}</span>
      </div>

      {/* Liquidity */}
      <div className="text-right">
        <span className="text-[#FFFFFF] text-sm">
          {formatVolume(liquidity)}
        </span>
      </div>

      {/* Trade Button */}
      <span className="px-3 py-1.5 btn-primary rounded-lg text-white text-xs font-medium transition-colors inline-block">
        Trade
      </span>
    </Link>
  );
}

function LoadingRow() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1A1A1A] animate-pulse items-center">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-[#1A1A1A] rounded" />
        <div className="w-8 h-8 bg-[#1A1A1A] rounded-full" />
        <div className="flex flex-col gap-1">
          <div className="h-4 w-20 bg-[#1A1A1A] rounded" />
          <div className="h-3 w-12 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="h-4 w-16 bg-[#1A1A1A] rounded ml-auto" />
      <div className="h-4 w-14 bg-[#1A1A1A] rounded ml-auto" />
      <div className="h-4 w-16 bg-[#1A1A1A] rounded ml-auto" />
      <div className="h-4 w-16 bg-[#1A1A1A] rounded ml-auto" />
      <div className="h-6 w-14 bg-[#1A1A1A] rounded" />
    </div>
  );
}

export default function MarketsTable({
  markets = [],
  tickers = {},
  isLoading,
}: MarketsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeFilter, setActiveFilter] = useState<"all" | "favorites">("all");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedMarkets = useMemo(() => {
    let result = [...markets];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (market) =>
          market.baseAsset.toLowerCase().includes(query) ||
          market.quoteAsset.toLowerCase().includes(query) ||
          market.symbol.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case "symbol":
          return sortDirection === "asc"
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case "price":
          aValue = parseFloat(
            tickers[a.symbol]?.lastPrice || a.latestPrice || "0"
          );
          bValue = parseFloat(
            tickers[b.symbol]?.lastPrice || b.latestPrice || "0"
          );
          break;
        case "change":
          aValue = parseFloat(tickers[a.symbol]?.priceChangePercent || "0");
          bValue = parseFloat(tickers[b.symbol]?.priceChangePercent || "0");
          break;
        case "volume":
          aValue = parseFloat(a.volumeInQuote || "0");
          bValue = parseFloat(b.volumeInQuote || "0");
          break;
        case "liquidity":
          aValue = parseFloat(a.totalLiquidityInQuote || "0");
          bValue = parseFloat(b.totalLiquidityInQuote || "0");
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [markets, tickers, searchQuery, sortField, sortDirection]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#FFFFFF] font-semibold text-lg">
            All Markets
          </span>
          <span className="text-[#666666] text-sm">({markets.length})</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-[#1A1A1A] text-[#FFFFFF]"
                : "text-[#666666] hover:text-[#FFFFFF]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("favorites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === "favorites"
                ? "bg-[#1A1A1A] text-[#FFFFFF]"
                : "text-[#666666] hover:text-[#FFFFFF]"
            }`}
          >
            <Star size={14} /> Favorites
          </button>
        </div>

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
            className="bg-[#111111] border border-[#1F1F1F] rounded-lg pl-9 pr-4 py-2 text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#333333] w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1F1F1F] bg-[#0A0A0A]">
            <SortHeader
              label="MARKET"
              field="symbol"
              currentSort={sortField}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label="PRICE"
              field="price"
              currentSort={sortField}
              currentDirection={sortDirection}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="24H CHANGE"
              field="change"
              currentSort={sortField}
              currentDirection={sortDirection}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="24H VOLUME"
              field="volume"
              currentSort={sortField}
              currentDirection={sortDirection}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="LIQUIDITY"
              field="liquidity"
              currentSort={sortField}
              currentDirection={sortDirection}
              onSort={handleSort}
              align="right"
            />
            <div className="w-14" />
          </div>

          {/* Table Body */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
            ) : filteredAndSortedMarkets.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <span className="text-[#666666] text-sm">No markets found</span>
              </div>
            ) : (
              filteredAndSortedMarkets.map((market) => (
                <MarketRow
                  key={market.symbol}
                  market={market}
                  ticker={tickers[market.symbol]}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
