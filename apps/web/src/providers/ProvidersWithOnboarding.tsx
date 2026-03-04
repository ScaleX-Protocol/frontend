'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useOnboarding, OnboardingProvider } from '@/hooks/useOnboarding';
import { useNativeTokenFaucet } from '@/features/faucet/hooks/useNativeTokenFaucet';
import { ToastProvider } from '@/hooks/useToast';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { ChainConfig } from '@/configs/chain';
import { useWorldMiniKit } from './WorldMiniKitProvider';
import { useWorldAuth } from '@/hooks/useWorldAuth';
import { Loader2 } from 'lucide-react';

function OnboardingHandler() {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const { showOnboarding, completeOnboarding, isOnboardingOpen } = useOnboarding();

  // Find embedded wallet (Privy wallet)
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const externalWallet = user?.wallet;

  // Request faucet tokens for embedded wallet
  useNativeTokenFaucet({
    address: embeddedWallet?.address,
    chainId: ChainConfig.defaultChainId,
    enabled: ready && !!embeddedWallet?.address,
  });

  // Request faucet tokens for external wallet
  useNativeTokenFaucet({
    address: externalWallet?.address,
    chainId: ChainConfig.defaultChainId,
    enabled: ready && !!externalWallet?.address,
  });

  // Show onboarding when user connects wallet for first time
  useEffect(() => {
    if (ready && user?.wallet && !user?.wallet?.address) {
      // User just logged in but no wallet yet
      return;
    }

    if (ready && user?.wallet?.address) {
      // User has a wallet address - show onboarding if they haven't seen it
      showOnboarding();
    }
  }, [user?.wallet?.address, ready, showOnboarding]);

  return (
    <OnboardingModal
      isOpen={isOnboardingOpen}
      onClose={() => {
        completeOnboarding();
      }}
    />
  );
}

// Wrapper to ensure OnboardingHandler only renders when Privy is ready
// This prevents wagmi hooks from being called before WagmiProvider is initialized
function OnboardingHandlerWrapper() {
  const { ready } = usePrivy();

  // Don't render OnboardingHandler until Privy is ready
  // This ensures all provider contexts (including WagmiProvider) are available
  if (!ready) {
    return null;
  }

  return <OnboardingHandler />;
}

// World App login overlay — shown when running inside World App and not yet authenticated
function WorldAppLoginOverlay() {
  const { authenticate, isAuthenticating, error, clearError } = useWorldAuth();

  const handleSignIn = async () => {
    clearError();
    try {
      await authenticate();
    } catch {
      // error already set in hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
      <img src="/images/logo/ScaleX-Logo.png" alt="ScaleX" className="w-16 h-16 mb-6 rounded-2xl" />
      <h1 className="text-2xl font-bold text-[#E0E0E0] mb-2">ScaleX Exchange</h1>
      <p className="text-[#808080] text-sm text-center mb-10">
        The Most Capital Efficient and Safe DApp for Agent and Human
      </p>

      <button
        onClick={handleSignIn}
        disabled={isAuthenticating}
        className="w-full max-w-xs flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity disabled:opacity-60"
      >
        {isAuthenticating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <img src="/images/worldcoin-logo.svg" alt="" className="w-5 h-5" onError={(e) => (e.currentTarget.style.display = 'none')} />
            Sign in with World App
          </>
        )}
      </button>

      {error && (
        <p className="mt-4 text-red-400 text-xs text-center max-w-xs">{error}</p>
      )}

      <p className="mt-6 text-[#505050] text-xs text-center">
        Verify your identity with World ID to get started
      </p>
    </div>
  );
}

// Loading skeleton shown while Privy initializes
function LoadingSkeleton() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#F06718]/30 border-t-[#F06718] rounded-full animate-spin" />
        <p className="text-[#E0E0E0]/70 text-sm">Initializing...</p>
      </div>
    </div>
  );
}

export function ProvidersWithOnboarding({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { isInWorldApp } = useWorldMiniKit();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout fallback: if Privy doesn't become ready within 5 seconds, show content anyway
  useEffect(() => {
    if (ready) return;

    const timeout = setTimeout(() => {
      console.warn('[ProvidersWithOnboarding] Privy initialization timed out after 5 seconds');
      setTimedOut(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [ready]);

  const shouldShowContent = ready || timedOut;

  // Inside World App: gate the app behind World App sign-in until authenticated
  const showWorldAppGate = isInWorldApp && shouldShowContent && !authenticated;

  return (
    <OnboardingProvider>
      <ToastProvider>
        {showWorldAppGate ? (
          <WorldAppLoginOverlay />
        ) : (
          <>
            <OnboardingHandlerWrapper />
            {shouldShowContent ? children : <LoadingSkeleton />}
          </>
        )}
        <ToastContainer />
      </ToastProvider>
    </OnboardingProvider>
  );
}
