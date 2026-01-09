'use client';

import { useState } from 'react';
import Orders from './orders/orders';
import Trades from './trades/trades';

export default function OrderBook({ symbol }: { symbol: string }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>('orders');

  return (
    <div className="w-full h-full bg-[#242424] rounded-[20px] px-[10px] py-[18px] overflow-hidden flex flex-col border border-[#404040]">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-[#E0E0E0]/20">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 pb-2 text-lg transition-colors relative ${
            activeTab === 'orders'
              ? 'text-[#E0E0E0] font-bold'
              : 'text-[#E0E0E0]/70 font-medium hover:text-[#E0E0E0]'
          }`}
        >
          Orders
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`flex-1 pb-2 text-lg transition-colors relative ${
            activeTab === 'trades'
              ? 'text-[#E0E0E0] font-bold'
              : 'text-[#E0E0E0]/70 font-medium hover:text-[#E0E0E0]'
          }`}
        >
          Trades
          {activeTab === 'trades' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
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
