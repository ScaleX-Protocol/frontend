import { useState } from 'react';
import LimitOrder from './limit/limit';
import MarketOrder from './market/market';
import Swap from './swap/swap';

export default function PlaceOrder() {
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'swap'>('market');

  return (
    <div className="w-full h-full bg-[#2C2C2C] rounded-md p-2">
      <div className="flex flex-col gap-2 h-full">
        <div className="flex border-b border-[#E0E0E0]/20 pb-2">
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'market' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('market')}
          >
            Market
          </button>
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'limit' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('limit')}
          >
            Limit
          </button>
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'swap' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </button>
        </div>

        {activeTab === 'market' && <MarketOrder />}

        {activeTab === 'limit' && <LimitOrder />}

        {activeTab === 'swap' && <Swap />}
      </div>
    </div>
  );
}
