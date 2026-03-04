import { Wallet, Bell } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletState } from '@/hooks/useWalletState';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import { ChainTypeConfig } from '@/configs/chainType';
import WalletSheet from '@/features/overview/components/WalletSheet';
import ConnectWalletModal from '@/components/modals/connectWalletModal';
import LogoutConfirmationModal from '@/components/modals/logoutConfirmationModal';
import SearchBar from '@/components/layout/SearchBar';

export default function AppHeader() {
  return <AppHeaderContent />;
}

function AppHeaderContent() {
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { pathname } = useLocation();
  const { ready } = usePrivy();
  const wallet = useWalletState();
  const isMobile = useIsMobile();

  // Pick the right addresses based on chain mode
  const externalAddress = ChainTypeConfig.isSolana
    ? wallet.externalSolanaWallet.address
    : wallet.externalWallet.address;
  const embeddedAddress = ChainTypeConfig.isSolana
    ? wallet.embeddedSolanaWallet.address
    : wallet.embeddedWallet.address;
  const shortAddress = wallet.isConnected && externalAddress !== 'Not Connected'
    ? `${externalAddress.slice(0, 10)}...${externalAddress.slice(-4)}`
    : `${embeddedAddress.slice(0, 10)}...${embeddedAddress.slice(-4)}`;
  const mobileShortAddress = wallet.isConnected && externalAddress !== 'Not Connected'
    ? `${externalAddress.slice(0, 4)}...${externalAddress.slice(-2)}`
    : `${embeddedAddress.slice(0, 4)}...${embeddedAddress.slice(-2)}`;

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

  const handleLogout = () => {
    wallet.logout();
    setShowLogoutConfirmation(false);
  };

  return (
    <>
      {/* Global Connect Wallet Modal - shows when wallet is not connected */}
      {/* <ConnectWalletModal
        isOpen={!wallet.isConnected}
        onConnect={handleLogin}
        disabled={!ready}
      /> */}

      <header className="sticky top-0 w-full flex flex-row items-center justify-between px-6 bg-[#000000]/80 backdrop-blur-sm min-h-[64px] border-b border-[#1F1F1F]" style={{ zIndex: 'var(--z-sticky)' as React.CSSProperties['zIndex'] }}>
        {/* Left: Breadcrumb (Desktop) / Logo (Mobile) */}
        <div className="flex items-center">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <img
              src="/images/logo/ScaleX-Logo.png"
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
        <div className="flex items-center gap-4">
          {/* Notification button - Desktop only */}
          <button
            type="button"
            className="hidden md:flex bg-[#111111] p-2.5 hover:bg-[#1A1A1A] rounded-full border border-[#222222] text-[#888888] hover:text-[#A0A0A0] transition-colors relative"
          >
            <Bell size={18} />
            {/* Red notification dot */}
            <span className="absolute top-2 right-3 w-1 h-1 bg-[#E26B1D] rounded-full" />
          </button>

          {/* <div className='h-8 w-px bg-[#222222]'></div> */}

          {/* Connect Wallet Button */}
          {wallet.isConnected ? (
            isMobile ? (
              // Mobile connected: compact address with orange status dot
              <button
                type="button"
                onClick={() => setShowLogoutConfirmation(true)}
                className="py-1.5 px-3 bg-[#1A1A1A] rounded-full cursor-pointer transition-all flex items-center gap-2 border border-[#333333] hover:border-[#444444]"
              >
                <span className="w-2 h-2 rounded-full bg-[#F06718] animate-pulse" />
                <span className="text-xs leading-[16px] text-[#E0E0E0] font-medium">{mobileShortAddress}</span>
              </button>
            ) : (
              // Desktop connected: full button with wallet icon
              <button
                type="button"
                onClick={handleOpenWalletSheet}
                className="btn-gradient-border cursor-pointer flex items-center gap-2 transition-all"
              >
                {/* <img src={wallet.externalWallet.wallet?.meta.icon || ''} alt="Wallet Icon" className="h-7 w-7" /> */}
                <div className='flex flex-col gap-0.5 items-start'>
                  <span className='text-xs leading-[16px] text-[#FFFFFF]/40'>Connected Wallet</span>
                  <span className="text-xs leading-[16px] text-[#FFFFFF] font-medium">{shortAddress}</span>
                </div>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="py-2 px-5 bg-[#FFFFFF] rounded-full font-semibold cursor-pointer transition-all flex items-center gap-2 leading-[16px] text-[#000000] hover:bg-[#F0F0F0]"
            >
              <span className="text-xs">Connect</span>
              <Wallet size={14} />
            </button>
          )}
        </div>
      </header>
      <WalletSheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen} />
      <LogoutConfirmationModal 
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirmation(false)}
      />
    </>
  );
}

