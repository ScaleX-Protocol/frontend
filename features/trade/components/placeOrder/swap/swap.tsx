'use client';

import { ArrowDownUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Swap() {
  const [fromToken, setFromToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('1000');
  const [toToken, setToToken] = useState('WBTC');
  const [toAmount, setToAmount] = useState('1000');

  const handleSwap = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setFromAmount(toAmount);
    setToToken(tempToken);
    setToAmount(tempAmount);
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        {/* From Section */}
        <div className="flex flex-col gap-2 p-2 border border-[#E0E0E0]/70 rounded-md">
          <span className="text-sm text-[#E0E0E0]/70">From</span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full text-xl border-none outline-none bg-none text-[#E0E0E0]"
              />
            </div>

            <div className="relative">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="px-2 py-2 border border-[#E0E0E0]/70 rounded-[4px] text-[#E0E0E0] focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 appearance-none cursor-pointer pr-8"
              >
                <option value="USDC">USDC</option>
                <option value="WBTC">WBTC</option>
                <option value="ETH">ETH</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-[#E0E0E0]" />
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full justify-between">
            <span className="text-sm text-[#E0E0E0]">= 999.999</span>
            <span className="text-sm text-[#E0E0E0]">999.999</span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[#2A2A2A] transition-colors border border-[#E0E0E0]/20"
            onClick={handleSwap}
          >
            <ArrowDownUp size={20} className="text-[#E0E0E0]" />
          </button>
        </div>

        {/* To Section */}
        <div className="flex flex-col gap-2 p-2 border border-[#E0E0E0]/70 rounded-md">
          <span className="text-sm text-[#E0E0E0]/70">From</span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="w-full text-xl border-none outline-none bg-none text-[#E0E0E0]"
              />
            </div>

            <div className="relative">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="px-2 py-2 border border-[#E0E0E0]/70 rounded-[4px] text-[#E0E0E0] focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 appearance-none cursor-pointer pr-8"
              >
                <option value="WBTC">WBTC</option>
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-[#E0E0E0]" />
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full justify-between">
            <span className="text-sm text-[#E0E0E0]">= 999.999</span>
            <span className="text-sm text-[#E0E0E0]">999.999</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full py-2 font-medium bg-[#F06718] text-[#E0E0E0] rounded-md transition-colors"
      >
        SWAP
      </button>
    </div>
  );
}
