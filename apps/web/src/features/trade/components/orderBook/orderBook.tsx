'use client';

import Orders from './orders/orders';

export default function OrderBook({ symbol }: { symbol: string }) {
  return (
    <div className="w-full h-full bg-[#0A0A0A] rounded-[16px] overflow-hidden flex flex-col border border-[#1F1F1F]">
      <Orders symbol={symbol} />
    </div>
  );
}

