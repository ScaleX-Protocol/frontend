import { useState } from "react";
import {
  calculateTotal,
  formatAmount,
  formatPrice,
} from "@/features/trade/utils/orderBook.helper";
import type {
  SpreadOption,
  ViewMode,
} from "@/features/trade/types/orderBook.types";
import {
  useDepth,
  type UseDepthParams,
} from "@/features/trade/hooks/orderBook/useDepth";
import DepthBreakdownModal from "../DepthBreakdownModal";

export default function Orders({ symbol }: { symbol: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [spread, setSpread] = useState<SpreadOption>(1);
  const [isSpreadOpen, setIsSpreadOpen] = useState(false);
  const [isDepthModalOpen, setIsDepthModalOpen] = useState(false);

  const params: UseDepthParams = {
    symbol: symbol,
    limit: 14,
  };

  const { data, isLoading, error } = useDepth(params);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#3A3A3A]">
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-[#3A3A3A] rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-[#3A3A3A] rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-[#3A3A3A] rounded animate-pulse"></div>
          </div>
          <div className="w-12 h-6 bg-[#3A3A3A] rounded animate-pulse"></div>
        </div>

        {/* Column headers skeleton */}
        <div className="flex items-center px-3 py-2 border-b border-[#3A3A3A]">
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse"></div>
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse ml-2"></div>
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse ml-2"></div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 overflow-hidden">
          {[...Array(10)].map((__, index) => (
            <div
              key={`skeleton-${index}`}
              className="px-3 py-2 border-b border-[#3A3A3A]/20"
            >
              <div className="flex items-center">
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse"></div>
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse ml-2"></div>
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse ml-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
          <div className="flex-1 text-left">Price</div>
          <div className="flex-1 text-right">Amount</div>
          <div className="flex-1 text-right">Total</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-red-400 text-sm mb-4">
            Error loading order book
          </div>
        </div>
      </div>
    );
  }

  if (!data || (!data.bids.length && !data.asks.length)) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
          <div className="flex-1 text-left">Price</div>
          <div className="flex-1 text-right">Amount</div>
          <div className="flex-1 text-right">Total</div>
        </div>
      </div>
    );
  }

  // Calculate cumulative totals for depth visualization
  const calculateCumulatives = (orders: [string, string][]) => {
    let cumulative = 0;
    return orders.map(([amount]) => {
      const amountNum = parseFloat(amount) / 10 ** 18;
      cumulative += amountNum;
      return cumulative;
    });
  };

  const hasBids = data.bids && data.bids.length > 0;
  const hasAsks = data.asks && data.asks.length > 0;
  const bidsData = viewMode === "both" ? data.bids.slice(0, 6) : data.bids;
  const asksData = viewMode === "both" ? data.asks.slice(0, 6) : data.asks;
  const bidCumulatives = calculateCumulatives(data.bids);
  const askCumulatives = calculateCumulatives(data.asks);
  const maxBidCumulative = Math.max(...bidCumulatives);
  const maxAskCumulative = Math.max(...askCumulatives);

  const spreadOptions: SpreadOption[] = [0.01, 0.1, 1, 10, 50, 100];

  return (
    <div className="h-full flex flex-col">
      {/* Header with view mode selector and spread */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A3A]">
        <div className="flex gap-2 items-center">
          {/* Both View - horizontal bars */}
          <button
            type="button"
            onClick={() => setViewMode("both")}
            className={`p-1.5 flex items-center justify-center rounded transition-colors ${
              viewMode === "both"
                ? "bg-[#3A3A3A] text-[#E0E0E0]"
                : "text-[#A0A0A0] hover:bg-[#3A3A3A] hover:text-[#E0E0E0]"
            }`}
            title="Both"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <title>Both</title>
              {/* Red bars (top) */}
              <rect x="3" y="3" width="12" height="2" fill="#ef4444" opacity="0.8" />
              <rect x="5" y="6" width="10" height="2" fill="#ef4444" opacity="0.6" />
              {/* Green bars (bottom) */}
              <rect x="3" y="10" width="12" height="2" fill="#22c55e" opacity="0.8" />
              <rect x="5" y="13" width="10" height="2" fill="#22c55e" opacity="0.6" />
            </svg>
          </button>

          {/* Asks Only - red bars pointing up */}
          <button
            type="button"
            onClick={() => setViewMode("asks")}
            className={`p-1.5 flex items-center justify-center rounded transition-colors ${
              viewMode === "asks"
                ? "bg-[#3A3A3A]"
                : "hover:bg-[#3A3A3A]"
            }`}
            title="Asks Only"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <title>Asks</title>
              <rect x="3" y="3" width="12" height="2" fill="#ef4444" />
              <rect x="5" y="6" width="10" height="2" fill="#ef4444" opacity="0.8" />
              <rect x="7" y="9" width="8" height="2" fill="#ef4444" opacity="0.6" />
              <rect x="9" y="12" width="6" height="2" fill="#ef4444" opacity="0.4" />
            </svg>
          </button>

          {/* Bids Only - green bars pointing down */}
          <button
            type="button"
            onClick={() => setViewMode("bids")}
            className={`p-1.5 flex items-center justify-center rounded transition-colors ${
              viewMode === "bids"
                ? "bg-[#3A3A3A]"
                : "hover:bg-[#3A3A3A]"
            }`}
            title="Bids Only"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <title>Bids</title>
              <rect x="9" y="3" width="6" height="2" fill="#22c55e" opacity="0.4" />
              <rect x="7" y="6" width="8" height="2" fill="#22c55e" opacity="0.6" />
              <rect x="5" y="9" width="10" height="2" fill="#22c55e" opacity="0.8" />
              <rect x="3" y="12" width="12" height="2" fill="#22c55e" />
            </svg>
          </button>
        </div>

        {/* Spread Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSpreadOpen(!isSpreadOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#E0E0E0] bg-[#3A3A3A] rounded hover:bg-[#444444] transition-colors"
          >
            <span>{spread}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <title>Chevron Down</title>
              <path
                d="M3 5L6 8L9 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {isSpreadOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded shadow-lg z-10 min-w-20">
              {spreadOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setSpread(option);
                    setIsSpreadOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-[#3A3A3A] transition-colors ${
                    spread === option ? "text-[#F06718]" : "text-[#E0E0E0]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
        <div className="flex-1 text-left">Price</div>
        <div className="flex-1 text-right">Amount</div>
        <div className="flex-1 text-right">Total</div>
      </div>

      <div className="flex flex-col" style={{ height: "336px" }}>
        {hasAsks && (
          <div
            className={`overflow-y-auto ${
              viewMode === "both"
                ? "flex flex-col"
                : viewMode === "asks"
                ? "flex flex-col"
                : "hidden"
            }`}
          >
            <div className="flex flex-col-reverse">
              {asksData.map(([price, amount], index) => {
                const cumulative = askCumulatives[index];
                const percentage = (cumulative / maxAskCumulative) * 100;

                return (
                  <div
                    key={`ask-${price}-${amount}`}
                    className="relative px-3 py-1 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-red-900/20"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center text-xs font-mono">
                      <div className="flex-1 text-left text-red-400">
                        {formatPrice(price)}
                      </div>
                      <div className="flex-1 text-right text-[#E0E0E0]">
                        {formatAmount(amount)}
                      </div>
                      <div className="flex-1 text-right text-gray-400">
                        {calculateTotal(price, amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {viewMode === "both" && (
          <div className="px-3 py-2 bg-[#3A3A3A] border-y border-[#444444] shrink-0">
            {hasBids && hasAsks ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-400 font-mono font-semibold">
                  {formatPrice(data.bids[0][0])}
                </span>
                <span className="text-gray-400">
                  ↕{" "}
                  {(
                    parseFloat(data.asks[0][0]) / 10 ** 6 -
                    parseFloat(data.bids[0][0]) / 10 ** 6
                  ).toFixed(2)}
                </span>
                <span className="text-red-400 font-mono font-semibold">
                  {formatPrice(data.asks[0][0])}
                </span>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-xs">
                Spread unavailable
              </div>
            )}
          </div>
        )}
        {hasBids && (
          <div
            className={`overflow-y-auto ${
              viewMode === "both"
                ? "flex flex-col"
                : viewMode === "bids"
                ? "flex flex-col"
                : "hidden"
            }`}
          >
            {bidsData.map(([price, amount], index) => {
              const cumulative = bidCumulatives[index];
              const percentage = (cumulative / maxBidCumulative) * 100;

              return (
                <div
                  key={`bid-${price}-${amount}`}
                  className="relative px-3 py-1 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-green-900/20"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center text-xs font-mono">
                    <div className="flex-1 text-left text-green-400">
                      {formatPrice(price)}
                    </div>
                    <div className="flex-1 text-right text-[#E0E0E0]">
                      {formatAmount(amount)}
                    </div>
                    <div className="flex-1 text-right text-gray-400">
                      {calculateTotal(price, amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Depth Breakdown Modal */}
      {isDepthModalOpen && (
        <DepthBreakdownModal
          symbol={symbol}
          onClose={() => setIsDepthModalOpen(false)}
        />
      )}
    </div>
  );
}
