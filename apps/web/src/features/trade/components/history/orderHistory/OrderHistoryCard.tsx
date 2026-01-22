'use client';

import type { Order } from '@/features/trade/types/history.types';
import { formatPrice, formatAmount } from '@/features/trade/utils/history.helper';

interface OrderHistoryCardProps {
  order: Order;
  baseDecimals?: number;
  quoteDecimals?: number;
}

export function OrderHistoryCard({
  order,
  baseDecimals = 18,
  quoteDecimals = 6,
}: OrderHistoryCardProps) {
  const isBuy = order.side === 'BUY';
  const baseSymbol = order.symbol?.split('/')[0] || 'WETH';
  
  // Calculate filled percentage
  const origQty = parseFloat(order.origQty || '0');
  const executedQty = parseFloat(order.executedQty || '0');
  const filledPercentage = origQty > 0 ? (executedQty / origQty) * 100 : 0;

  // Format date for display (Nov 14, 10:23 AM format)
  const formatDisplayTime = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'FILLED':
        return 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30';
      case 'PARTIALLY_FILLED':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';
      case 'CANCELED':
        return 'bg-[#666666]/10 text-[#666666] border-[#666666]/30';
      case 'NEW':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30';
      default:
        return 'bg-[#666666]/10 text-[#666666] border-[#666666]/30';
    }
  };

  return (
    <div className="bg-[#111111] rounded-[12px] border border-[#1F1F1F] p-4 flex flex-col gap-2">
      {/* Header Row: Side + Token + Type Badge | Time */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Side Indicator Bar */}
          <div className={`w-1 h-4 rounded-full ${isBuy ? 'bg-[#2ECC71]' : 'bg-[#EF4444]'}`} />
          {/* Side + Symbol */}
          <span className="text-sm leading-[20px] font-semibold text-white">
            {isBuy ? 'Buy' : 'Sell'} {baseSymbol}
          </span>
          {/* Type Badge */}
          <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#333333] text-[10px] leading-[15px] text-[#888888] rounded">
            {order.type || 'Limit'}
          </span>
        </div>
        {/* Timestamp */}
        <span className="text-xs leading-[16px] text-[#555555]">
          {formatDisplayTime(order.time)}
        </span>
      </div>

      {/* Price and Amount Row */}
      <div className="flex items-start justify-between pb-1">
        {/* Price */}
        <div className="flex flex-col">
          <span className="text-[10px] leading-[20px] text-[#666666]">PRICE</span>
          <span className="text-sm leading-[20px] text-[#CCCCCC]">
            {formatPrice(order.price, quoteDecimals)}
          </span>
        </div>
        {/* Amount */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] leading-[20px] text-[#666666]">AMOUNT</span>
          <span className="text-sm leading-[20px] text-[#CCCCCC]">
            {formatAmount(order.executedQty || '0', baseDecimals)} / {formatAmount(order.origQty, baseDecimals)} {baseSymbol}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${isBuy ? 'bg-[#2ECC71]' : 'bg-[#EF4444]'}`}
          style={{ width: `${Math.min(filledPercentage, 100)}%` }}
        />
      </div>

      {/* Status Row */}
      <div className="flex items-center justify-end pt-1">
        <span className={`px-2.5 py-1 text-[11px] leading-[14px] font-medium rounded-full border ${getStatusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
