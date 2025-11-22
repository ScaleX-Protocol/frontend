'use client';

import { Wallet } from 'lucide-react';
import { useState } from 'react';

export default function MarketOrder() {
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
  const [marketSize, setMarketSize] = useState('');

  const availableToTrade = '9,999,999';

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        <div className="flex">
          <button
            type="button"
            className={`flex-1 py-2 font-medium rounded-l-md ${
              buySell === 'buy' ? 'bg-[#4ADE80]/80 text-[#E0E0E0]' : 'bg-[#4ADE80]/40 text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('buy')}
          >
            BUY
          </button>
          <button
            type="button"
            className={`flex-1 py-2 font-medium rounded-r-md ${
              buySell === 'sell' ? 'bg-[#B91C1C]/80 text-[#E0E0E0]' : 'bg-[#B91C1C]/40 text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('sell')}
          >
            SELL
          </button>
        </div>

        <div className="flex justify-between items-center text-[#E0E0E0]">
          <span>Available to trade</span>
          <div className="flex flex-row gap-1">
            <Wallet />
            <span className="font-medium"> {availableToTrade}</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={marketSize}
            onChange={(e) => setMarketSize(e.target.value)}
            className="w-full px-3 py-2 text-right border border-[#E0E0E0]/20 rounded-md focus:outline-none focus:ring focus:ring-[#E0E0E0]/40"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-[#E0E0E0]/70">Size</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-[#E0E0E0]">USDC</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`w-full py-2 font-medium rounded-md ${
          buySell === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
      >
        {buySell === 'buy' ? 'Buy' : 'Sell'}
      </button>
    </div>
  );
}
