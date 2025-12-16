import { LogIn, Wallet } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletState } from '@/hooks/useWalletState';
import WalletSheet from '@/features/home/components/WalletSheet';

// Content component that uses hooks - only rendered when Privy is ready
function AppHeaderContent() {
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const wallet = useWalletState();

  const externalAddress = wallet.externalWallet.address;
  const shortAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`;

  const handleLogin = () => {
    wallet.validateAllChains();
    wallet.login();
  };

  const handleOpenWalletSheet = () => {
    if (wallet.isConnected) {
      setWalletSheetOpen(true);
    }
  };

  return (
    <>
      <div className="w-full flex flex-row items-center justify-between py-4 px-8">
        <div className="flex flex-row gap-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <img
                src="/images/logo/ScaleX.webp"
                alt="ScaleX Protocol Logo"
                width={36}
                height={36}
                className="h-8 w-auto md:h-10 md:w-auto transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <span className="font-bold text-xl">ScaleX</span>
            {/* <span className="font-bold text-lg md:text-xl text-white transition-colors duration-300">
                Scale<span className="text-blue-400">X</span> Protocol
              </span> */}
          </Link>

          <div className="flex flex-row gap-2">
            <Link
              to="/home"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/home' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
            >
              Home
            </Link>
            <Link
              to="/trade"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/trade' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
            >
              Spot
            </Link>
            <Link
              to="/lending"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/lending' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
            >
              Lending
            </Link>
            <Link
              to="/faucet"
              className={`flex gap-2 py-2 px-3 font-medium rounded-md cursor-pointer ${pathname === '/faucet' ? 'border-b-2 border-[#F06718]/70' : 'text-[#E0E0E0]/70'}`}
            >
              Faucet
            </Link>
          </div>
        </div>
        {wallet.isConnected ? (
          <button
            type="button"
            onClick={handleOpenWalletSheet}
            className="py-2 px-4 border border-[#F06718] rounded-md font-medium cursor-pointer flex items-center gap-2 hover:bg-[#F06718]/10 transition-colors"
          >
            <Wallet size={20} />
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
      <WalletSheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen} />
    </>
  );
}

// Wrapper component that checks Privy ready state before rendering
export default function AppHeader() {
  const { ready } = usePrivy();

  // Don't render until Privy (and WagmiProvider) are ready
  // This prevents wagmi hooks from being called before WagmiProvider is initialized
  if (!ready) {
    return null;
  }

  return <AppHeaderContent />;
}
