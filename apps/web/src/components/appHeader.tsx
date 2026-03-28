import { Wallet, Bell, AlertTriangle } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { useWalletState, ChainTypeConfig } from '@scalex/service-wallet';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import WalletSheet from '@/features/overview/components/WalletSheet';
import ConnectWalletModal from '@/components/modals/connectWalletModal';
import LogoutConfirmationModal from '@/components/modals/logoutConfirmationModal';
import SearchBar from '@/components/layout/SearchBar';
import { SolanaConfig } from '@/configs/solana';
import TourReplayButton from '@/components/tour/TourReplayButton';

/**
 * Shows a warning banner when the connected external Solana wallet is on the wrong network.
 * Only renders in Solana mode. Solana has no programmatic network-switching API —
 * users must switch manually inside their wallet extension.
 */
function SolanaNetworkBanner() {
  const { wallets } = useWallets();

  // Find external (non-Privy) wallet
  const externalWallet = wallets.find((w) => w.standardWallet.name !== 'Privy');
  if (!externalWallet) return null;

  // Wallet Standard: account.chains tells us which network the account is active on
  // e.g. ["solana:mainnet"] or ["solana:devnet"]
  const activeChains = externalWallet.standardWallet.accounts?.[0]?.chains ?? [];
  const isWrongNetwork =
    activeChains.length > 0 &&
    !activeChains.includes(SolanaConfig.chainId as `${string}:${string}`);

  if (!isWrongNetwork) return null;

  const expectedNetwork = SolanaConfig.defaultCluster; // "devnet" or "mainnet"

  return (
    <div className="w-full bg-[#2a1a00] border-b border-[#F06718]/30 px-4 py-2 flex items-center justify-center gap-2 text-sm">
      <AlertTriangle size={14} className="text-[#F06718] shrink-0" />
      <span className="text-[#F06718]">
        Wrong network detected. Please switch your wallet to{' '}
        <strong className="text-[#F0921A] capitalize">{expectedNetwork}</strong> in your wallet
        extension.
      </span>
    </div>
  );
}

export default function AppHeader() {
  return (
    <>
      {ChainTypeConfig.isSolana && <SolanaNetworkBanner />}
      <AppHeaderContent />
    </>
  );
}

function AppHeaderContent() {
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { pathname } = useLocation();
  const { ready } = usePrivy();
  const wallet = useWalletState();
  const isMobile = useIsMobile();

  // Chain-aware address resolution (unified for EVM and Solana)
  const embeddedAddress = ChainTypeConfig.isSolana
    ? wallet.embeddedSolanaWallet.address
    : wallet.embeddedWallet.address;
  const externalAddress = ChainTypeConfig.isSolana
    ? wallet.externalSolanaWallet.address
    : wallet.externalWallet.address;

  // Best available address: prefer embedded, fallback to external
  const displayAddress = embeddedAddress !== 'Not Created' ? embeddedAddress : externalAddress;
  const hasValidAddress = displayAddress && displayAddress !== 'Not Connected' && displayAddress !== 'Not Created';

  const shortAddress = hasValidAddress
    ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-4)}`
    : 'Not Connected';
  const mobileShortAddress = hasValidAddress
    ? `${displayAddress.slice(0, 4)}...${displayAddress.slice(-2)}`
    : 'N/A';

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
          {/* Tour replay button - Desktop only */}
          <TourReplayButton />

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

