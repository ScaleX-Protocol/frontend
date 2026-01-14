import { LogIn, Wallet, Bell, ChevronRight } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletState } from '@scalex/service-wallet';
import WalletSheet from '@/features/home/components/WalletSheet';
import ConnectWalletModal from '@/components/modals/connectWalletModal';
import SearchBar from '@/components/layout/SearchBar';

export default function AppHeader() {
  return <AppHeaderContent />;
}

function AppHeaderContent() {
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const { ready } = usePrivy();
  const wallet = useWalletState();

  const externalAddress = wallet.externalWallet.address;
  const shortAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`;

  // Get current page name from pathname
  const getPageName = () => {
    const path = pathname.split('/')[1] || 'home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogin = () => {
    if (!ready) {
      console.warn('[AppHeader] Cannot login: Privy is not ready yet');
      return;
    }
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
      {/* Global Connect Wallet Modal - shows when wallet is not connected */}
      <ConnectWalletModal
        isOpen={!wallet.isConnected}
        onConnect={handleLogin}
        disabled={!ready}
      />

      <header className="w-full flex flex-row items-center justify-between px-6 bg-[#000000]/50 h-[64px] border-b border-[#1F1F1F]">
        {/* Left: Breadcrumb (Desktop) / Logo (Mobile) */}
        <div className="flex items-center">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <img
              src="/images/logo/ScaleX.webp"
              alt="ScaleX Protocol Logo"
              width={32}
              height={32}
              className="h-7 w-auto"
            />
            <span className="font-bold text-base text-[#E0E0E0]">ScaleX</span>
          </div>

          {/* Desktop Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 text-sm leading-[20px]">
            <span className="text-[#555555]">App</span>
            <span className="text-[#333333]">/</span>
            <span className="text-[#FFFFFF]">{getPageName()}</span>
          </nav>
        </div>

        {/* Center: Search Bar (Desktop only) */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notification button - Desktop only */}
          <button
            type="button"
            className="hidden md:flex p-2 hover:bg-[#1A1A1A] rounded-lg text-[#606060] hover:text-[#A0A0A0] transition-colors relative"
          >
            <Bell size={18} />
            {/* Red notification dot */}
            <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-[#F97316] rounded-full" />
          </button>

          {/* Connect Wallet Button */}
          {wallet.isConnected ? (
            <button
              type="button"
              onClick={handleOpenWalletSheet}
              className="py-2 px-4 bg-[#141414] border border-[#252525] rounded-full font-medium cursor-pointer flex items-center gap-2 hover:bg-[#1A1A1A] hover:border-[#303030] transition-all text-[#E0E0E0]"
            >
              <Wallet size={16} />
              <span className="text-sm">{shortAddress}</span>
              <ChevronRight size={14} className="text-[#606060]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="py-2 px-5 bg-[#FFFFFF] rounded-full font-semibold cursor-pointer transition-all flex items-center gap-2 leading-[16px] text-[#000000] hover:bg-[#F0F0F0]"
            >
              <span className="text-xs">Connect Wallet</span>
              <span className="text-xs">→</span>
            </button>
          )}
        </div>
      </header>
      <WalletSheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen} />
    </>
  );
}

