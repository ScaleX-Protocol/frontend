import { useTrades, type UseTradesParams } from '@/features/trade/hooks/orderBook/useTrades';
import { calculateTotal, formatAmount, formatPrice } from '@/features/trade/utils/orderBook.helper';

export default function Trades({ symbol }: { symbol: string }) {
  const params: UseTradesParams = {
    symbol,
    limit: 16,
    orderBy: 'desc',
  };

  const { data, isLoading, error } = useTrades(params);

  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 pt-2.5 border-b border-[#1F1F1F]">
          <div className="w-24 h-5 bg-[#3A3A3A] rounded animate-pulse" />
        </div>

        {/* Column headers skeleton */}
        <div className="flex items-center px-4 py-2">
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse" />
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse ml-2" />
          <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse ml-2" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 overflow-hidden">
          {[...Array(10)].map((__, index) => (
            <div
              key={`skeleton-${index}`}
              className="px-4 py-2 border-b border-[#1F1F1F]/20"
            >
              <div className="flex items-center">
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse" />
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse ml-2" />
                <div className="flex-1 h-3 bg-[#3A3A3A] rounded animate-pulse ml-2" />
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-2.5 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-sm font-semibold leading-[20px]">Recent Trades</span>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-4 py-2 text-[10px] font-medium leading-[15px] text-[#555555]">
          <div className="flex-1 text-left">PRICE</div>
          <div className="flex-1 text-right">SIZE</div>
          <div className="flex-1 text-right">TIME</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-red-400 text-sm mb-4">
            Error loading trades
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-2.5 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-sm font-semibold leading-[20px]">Recent Trades</span>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-4 py-2 text-[10px] font-medium leading-[15px] text-[#555555]">
          <div className="flex-1 text-left">PRICE</div>
          <div className="flex-1 text-right">SIZE</div>
          <div className="flex-1 text-right">TIME</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[#555555] text-sm">No trades available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-2.5 border-b border-[#1F1F1F]">
        <span className="text-[#FFFFFF] text-sm font-semibold leading-[20px]">Recent Trades</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 py-2 text-[10px] font-medium leading-[15px] text-[#555555]">
        <div className="flex-1 text-left">PRICE</div>
        <div className="flex-1 text-right">SIZE</div>
        <div className="flex-1 text-right">TIME</div>
      </div>

      {/* Trades list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {data.map((trade) => (
          <div 
            key={trade.id} 
            className="relative px-4 py-2 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
          >
            <div className="relative flex items-center text-xs leading-[16px]">
              <div className={`flex-1 text-left ${trade.isBuyerMaker ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                {formatPrice(trade.price)}
              </div>
              <div className="flex-1 text-right text-[#888888]">
                {formatAmount(trade.qty)}
              </div>
              <div className="flex-1 text-right text-[#444444]">
                {formatTime(trade.time)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
