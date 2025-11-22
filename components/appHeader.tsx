'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ChartCandlestick, Droplet, Euro, LogIn, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletState } from '@/hooks/useWalletState';

export default function AppHeader() {
  const { authenticated, login, logout } = usePrivy();

  const wallet = useWalletState();

  const externalAddress = wallet.externalWallet.address;
  const shortAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`;

  const handleLogin = () => {
    wallet.validateAllChains();
    login();
  };

  const handleLogOut = () => {
    logout();
  };

  const pathname = usePathname();

  return (
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
          <Link
            href="/trade"
            className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/trade' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
          >
            <ChartCandlestick strokeWidth={1.5} /> Spot
          </Link>
          <Link
            href="/lending"
            className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/lending' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
          >
            <Euro strokeWidth={1.5} /> Lending
          </Link>
          <Link
            href="/faucet"
            className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/faucet' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
          >
            <Droplet strokeWidth={1.5} /> Faucet
          </Link>
        </div>
      </div>
      {authenticated ? (
        <button
          type="button"
          onClick={handleLogOut}
          className="py-2 px-4 border border-[#F06718] rounded-md font-medium cursor-pointer flex items-center gap-2"
        >
          <LogOut size={20} />
          {shortAddress}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLogin}
          className="py-2 px-4 bg-[#F06718] rounded-md font-medium cursor-pointer hover:bg-[#f0782a] transition-colors duration-200 flex items-center gap-2"
        >
          <LogIn size={20} />
          Connect
        </button>
      )}
    </div>
  );
}
