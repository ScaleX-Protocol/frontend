'use client';

import { useState } from 'react';
import Orders from './orders/orders';
import Trades from './trades/trades';

export default function OrderBook({ symbol }: { symbol: string }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>('orders');

  return (
    <div className="w-full h-full bg-[#2C2C2C] rounded-lg overflow-hidden flex flex-col">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-[#3A3A3A]">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'orders'
              ? 'text-[#E0E0E0]'
              : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
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
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'trades'
              ? 'text-[#E0E0E0]'
              : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
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
