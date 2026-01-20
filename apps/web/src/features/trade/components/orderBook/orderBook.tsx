'use client';

import { useState } from 'react';
import Orders from './orders/orders';
import Trades from './trades/trades';

export default function OrderBook({ symbol }: { symbol: string }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>('orders');

  return (
    <div className="w-full h-full bg-[#0A0A0A] rounded-[16px] overflow-hidden flex flex-col border border-[#404040]">
      {/* Tabs Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-0.5 text-[10px] leading-[15px] relative transition-colors ${
            activeTab === 'orders'
              ? 'text-[#FFFFFF]'
              : 'text-[#555555] hover:text-[#FFFFFF]'
          }`}
        >
          Orders
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`pb-0.5 text-[10px] leading-[15px] relative transition-colors ${
            activeTab === 'trades'
              ? 'text-[#FFFFFF]'
              : 'text-[#555555] hover:text-[#FFFFFF]'
          }`}
        >
          Trades
          {activeTab === 'trades' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'orders' && <Orders symbol={symbol} />}
        {activeTab === 'trades' && <Trades symbol={symbol} />}
      </div>
    </div>
  );
}

