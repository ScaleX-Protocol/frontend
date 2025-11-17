'use client';

import { ChartCandlestick, Droplet, Euro } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useWalletState } from '@/hooks/useWalletState';
import Trade from '@/features/trade/components/trade';
import Lending from '@/features/lending/components/lending';
import Faucet from '@/features/faucet/components/faucet';
import { usePrivy } from '@privy-io/react-auth';

export default function TradePage() {
  const [activeTab, setActiveTab] = useState<'Spot' | 'Lending' | 'Faucet'>('Spot');

  const { authenticated, login, logout } = usePrivy();

  const wallet = useWalletState();

  const handleLogin = () => {
    wallet.validateAllChains();
    login();
  };

  const handleLogOut = () => {
    logout();
  };

  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <div className="w-full flex flex-row items-center justify-between py-4 px-8">
        <div className="flex flex-row gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image
                src="/images/logo/ScaleX.webp"
                alt="ScaleX Protocol Logo"
                width={36}
                height={36}
                className="h-8 w-auto md:h-10 md:w-auto transition-all duration-300 group-hover:scale-110"
                priority
              />
            </div>
            <span className="font-bold text-xl">Scale X</span>
            {/* <span className="font-bold text-lg md:text-xl text-white transition-colors duration-300">
              Scale<span className="text-blue-400">X</span> Protocol
            </span> */}
          </Link>

          <div className="flex flex-row gap-2">
            <button
              type="button"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${
                activeTab === 'Spot' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'
              }`}
              onClick={() => setActiveTab('Spot')}
            >
              <ChartCandlestick strokeWidth={1.5} /> Spot
            </button>
            <button
              type="button"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${
                activeTab === 'Lending' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'
              }`}
              onClick={() => setActiveTab('Lending')}
            >
              <Euro strokeWidth={1.5} /> Lending
            </button>
            <button
              type="button"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${
                activeTab === 'Faucet' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'
              }`}
              onClick={() => setActiveTab('Faucet')}
            >
              <Droplet strokeWidth={1.5} /> Faucet
            </button>
          </div>
        </div>
        {authenticated ? (
          <button
            type="button"
            onClick={handleLogOut}
            className="py-2 px-4 bg-[#F06718] rounded-md font-medium cursor-pointer hover:bg-[#f0782a] transition-colors duration-200 flex items-center gap-2"
          >
            Log Out
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="py-2 px-4 bg-[#F06718] rounded-md font-medium cursor-pointer hover:bg-[#f0782a] transition-colors duration-200 flex items-center gap-2"
          >
            Connect
          </button>
        )}
      </div>

      {activeTab === 'Spot' && <Trade />}
      {activeTab === 'Lending' && <Lending />}
      {activeTab === 'Faucet' && <Faucet />}
    </div>
  );
}
