'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useOnboarding, OnboardingProvider } from '@/hooks/useOnboarding';
// TEMPORARILY DISABLED: import { useNativeTokenFaucet } from '@/features/faucet/hooks/useNativeTokenFaucet';
import { ToastProvider } from '@/hooks/useToast';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
// TEMPORARILY DISABLED: import { ChainConfig } from '@/configs/chain';

function OnboardingHandler() {
  const { user, ready } = usePrivy();
  const { showOnboarding, completeOnboarding, isOnboardingOpen } = useOnboarding();

  // TEMPORARILY DISABLED: Check native token balance and request from faucet if needed
  // This was calling usePublicClient (wagmi hook) before WagmiProvider was fully ready
  // useNativeTokenFaucet({
  //   address: user?.wallet?.address,
  //   chainId: ChainConfig.defaultChainId,
  //   enabled: ready && !!user?.wallet?.address,
  // });

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
  const { ready } = usePrivy();
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

  return (
    <OnboardingProvider>
      <ToastProvider>
        <OnboardingHandlerWrapper />
        {shouldShowContent ? children : <LoadingSkeleton />}
        <ToastContainer />
      </ToastProvider>
    </OnboardingProvider>
  );
}
