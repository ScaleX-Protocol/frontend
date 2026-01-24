import { useState, useRef, useEffect } from "react";
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
import { useTradeContext } from "@/features/trade/context/TradeContext";
import DepthBreakdownModal from "../DepthBreakdownModal";
import { ArrowDown, ArrowUp, ArrowUpRight, ArrowDownRight, Menu } from "lucide-react";

interface OrdersProps {
  symbol: string;
  variant?: 'desktop' | 'mobile';
}

export default function Orders({ 
  symbol, 
  variant = 'desktop',
}: OrdersProps) {
  // Get decimals from context (single source of truth)
  const { baseDecimals, quoteDecimals } = useTradeContext();
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [spread, setSpread] = useState<SpreadOption>(1);
  const [isSpreadOpen, setIsSpreadOpen] = useState(false);
  const [isDepthModalOpen, setIsDepthModalOpen] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const prevPriceRef = useRef<string | null>(null);

  const params: UseDepthParams = {
    symbol: symbol,
    limit: variant === 'mobile' ? 5 : 12,
  };

  const { data, isLoading, error } = useDepth(params);

  // Track price direction
  useEffect(() => {
    if (data?.bids?.[0]?.[0]) {
      const currentPrice = data.bids[0][0];
      if (prevPriceRef.current !== null) {
        const current = parseFloat(currentPrice);
        const previous = parseFloat(prevPriceRef.current);
        if (current > previous) {
          setPriceDirection('up');
        } else if (current < previous) {
          setPriceDirection('down');
        }
      }
      prevPriceRef.current = currentPrice;
    }
  }, [data?.bids]);

  // Mobile variant: simplified compact orderbook
  if (variant === 'mobile') {
    if (isLoading) {
      return (
        <div className="flex flex-col h-full w-[135px]">
          <div className="flex justify-between pb-2">
            <span className="text-[#555555] text-[10px] leading-[15px] font-medium">PRICE</span>
            <span className="text-[#555555] text-[10px] leading-[15px] font-medium">AMT</span>
          </div>
          {/* Skeleton asks */}
          <div className="flex flex-col-reverse gap-px">
            {[...Array(5)].map((__, index) => (
              <div key={`ask-skeleton-${index}`} className="flex items-center justify-between">
                <div className="w-14 h-3 bg-[#3A3A3A] rounded animate-pulse" />
                <div className="w-8 h-3 bg-[#3A3A3A] rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Skeleton current price */}
          <div className="py-2">
            <div className="flex items-center justify-center gap-1">
              <div className="w-16 h-4 bg-[#3A3A3A] rounded animate-pulse" />
            </div>
          </div>
          {/* Skeleton bids */}
          <div className="flex flex-col gap-px">
            {[...Array(5)].map((__, index) => (
              <div key={`bid-skeleton-${index}`} className="flex items-center justify-between">
                <div className="w-14 h-3 bg-[#3A3A3A] rounded animate-pulse" />
                <div className="w-8 h-3 bg-[#3A3A3A] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error || !data || (!data.bids.length && !data.asks.length)) {
      return (
        <div className="flex flex-col h-full w-[135px]">
          <div className="flex justify-between pb-2">
            <span className="text-[#555555] text-[10px] leading-[15px] font-medium">PRICE</span>
            <span className="text-[#555555] text-[10px] leading-[15px] font-medium">AMT</span>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <span className="text-[#666666] text-xs">No data</span>
          </div>
        </div>
      );
    }

    const asksData = data.asks.slice(0, 5);
    const bidsData = data.bids.slice(0, 5);

    // Calculate max amounts for bar visualization
    const allAmounts = [...asksData, ...bidsData].map(([, amount]) => parseFloat(amount) / 10**baseDecimals);
    const maxAmount = Math.max(...allAmounts);

    return (
      <div className="flex flex-col h-full w-[135px]">
        <div className="flex justify-between pb-2">
          <span className="text-[#555555] text-[10px] leading-[15px] font-medium">PRICE</span>
          <span className="text-[#555555] text-[10px] leading-[15px] font-medium">AMT</span>
        </div>
        {/* Asks (Sells) - Red - Reversed order so lowest ask is at bottom */}
        <div className="flex flex-col-reverse gap-px">
          {asksData.map(([price, amount]) => {
            const amountNum = parseFloat(amount) / 10**baseDecimals;
            const percentage = (amountNum / maxAmount) * 100;
            
            return (
              <div
                key={`ask-${price}-${amount}`}
                className="relative flex items-center justify-between hover:bg-[#1A1A1A] cursor-pointer"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#EF4444]/10"
                  style={{ width: `${percentage}%` }}
                />
                <span className="relative text-[#EF4444] text-xs leading-[16px]">
                  {formatPrice(price, quoteDecimals)}
                </span>
                <span className="relative text-[#888888] text-xs leading-[16px]">
                  {formatAmount(amount, baseDecimals)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current Price */}
        <div className="py-2">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-xs leading-[16px] font-medium text-white`}>
              {data.bids[0] ? formatPrice(data.bids[0][0], quoteDecimals) : '--'}
            </span>
            {priceDirection === 'up' && <ArrowUp className="w-3 h-3 text-[#10B981]" />}
            {priceDirection === 'down' && <ArrowDown className="w-3 h-3 text-[#EF4444]" />}
          </div>
        </div>

        {/* Bids (Buys) - Green */}
        <div className="flex flex-col gap-px">
          {bidsData.map(([price, amount]) => {
            const amountNum = parseFloat(amount) / 10**baseDecimals;
            const percentage = (amountNum / maxAmount) * 100;
            
            return (
              <div
                key={`bid-${price}-${amount}`}
                className="relative flex items-center justify-between hover:bg-[#1A1A1A] cursor-pointer"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#2ECC71]/10"
                  style={{ width: `${percentage}%` }}
                />
                <span className="relative text-[#2ECC71] text-xs leading-[16ox]">
                  {formatPrice(price, quoteDecimals)}
                </span>
                <span className="relative text-[#888888] text-xs leading-[16ox]">
                  {formatAmount(amount, baseDecimals)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop variant (original code)
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
      const amountNum = parseFloat(amount) / 10 ** baseDecimals;
      cumulative += amountNum;
      return cumulative;
    });
  };

  const hasBids = data.bids && data.bids.length > 0;
  const hasAsks = data.asks && data.asks.length > 0;
  const bidsData = viewMode === "both" ? data.bids.slice(0, 5) : data.bids;
  const asksData = viewMode === "both" ? data.asks.slice(0, 5) : data.asks;
  const bidCumulatives = calculateCumulatives(data.bids);
  const askCumulatives = calculateCumulatives(data.asks);
  const maxBidCumulative = Math.max(...bidCumulatives);
  const maxAskCumulative = Math.max(...askCumulatives);

  const spreadOptions: SpreadOption[] = [0.01, 0.1, 1, 10, 50, 100];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 pt-2.5 border-b border-[#1F1F1F]">
        <span className='text-[#FFFFFF] text-sm font-semibold leading-[20px]'>Order Book</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 bg-[#111111] rounded">
            <button 
              type="button"
              onClick={() => setViewMode("both")} 
              className={`p-1 rounded transition-colors ${viewMode === 'both' ? 'bg-[#2A2A2A]' : 'hover:bg-[#2A2A2A]'}`}
            >
              <Menu className={`w-3 h-3 ${viewMode === 'both' ? 'text-[#FFFFFF]' : 'text-[#888888]'}`} />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode("asks")} 
              className={`p-1 rounded transition-colors ${viewMode === 'asks' ? 'bg-[#2A2A2A]' : 'hover:bg-[#2A2A2A]'}`}
            >
              <ArrowDown className={`w-3 h-3 ${viewMode === 'asks' ? 'text-[#FFFFFF]' : 'text-[#888888]'}`} />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode("bids")} 
              className={`p-1 rounded transition-colors ${viewMode === 'bids' ? 'bg-[#2A2A2A]' : 'hover:bg-[#2A2A2A]'}`}
            >
              <ArrowUp className={`w-3 h-3 ${viewMode === 'bids' ? 'text-[#FFFFFF]' : 'text-[#888888]'}`} />
            </button>
          </div>
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
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 py-2 text-[10px] font-medium leading-[15px] text-[#555555]">
        <div className="flex-1 text-left">PRICE</div>
        <div className="flex-1 text-right">SIZE</div>
        <div className="flex-1 text-right">TOTAL</div>
      </div>

      <div className="flex flex-col h-[382px]">
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
            <div className="flex flex-col-reverse gap-px">
              {asksData.map(([price, amount], index) => {
                const cumulative = askCumulatives[index];
                const percentage = (cumulative / maxAskCumulative) * 100;

                return (
                  <div
                    key={`ask-${price}-${amount}`}
                    className="relative px-4 py-2 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#EF4444]/10"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center text-xs leading-[16px]">
                      <div className="flex-1 text-left text-[#F43F5E]">
                        {formatPrice(price, quoteDecimals)}
                      </div>
                      <div className="flex-1 text-right text-[#888888]">
                        {formatAmount(amount, baseDecimals)}
                      </div>
                      <div className="flex-1 text-right text-[#444444]">
                        {calculateTotal(price, amount, quoteDecimals, baseDecimals)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {viewMode === "both" && (
          <div className="px-4 py-3 border-y border-[#1F1F1F] shrink-0 bg-[#0F0F0F]">
            {hasBids && hasAsks ? (
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold leading-[28px] flex items-center gap-2 ${priceDirection === 'down' ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                  {formatPrice(data.bids[0][0], quoteDecimals)}
                  {priceDirection === 'down' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </span>
                <span className="text-[#555555] text-xs leading-[16px]">
                  ${formatPrice(data.bids[0][0], quoteDecimals)}
                </span>
              </div>
            ) : (
              <div className="text-center text-[#99A1AF] text-xs">
                Spread unavailable
              </div>
            )}
          </div>
        )}
        {hasBids && (
          <div
            className={`overflow-y-auto ${
              viewMode === "both"
                ? "flex flex-col gap-px"
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
                  className="relative px-4 py-2 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#22C55E]/10"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center text-xs leading-[16px]">
                    <div className="flex-1 text-left text-[#10B981]">
                      {formatPrice(price, quoteDecimals)}
                    </div>
                    <div className="flex-1 text-right text-[#888888]">
                      {formatAmount(amount, baseDecimals)}
                    </div>
                    <div className="flex-1 text-right text-[#444444]">
                      {calculateTotal(price, amount, quoteDecimals, baseDecimals)}
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

