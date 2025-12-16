'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useOnboarding, OnboardingProvider } from '@/hooks/useOnboarding';
// TEMPORARILY DISABLED: import { useNativeTokenFaucet } from '@/features/faucet/hooks/useNativeTokenFaucet';
import { ToastProvider } from '@/hooks/useToast';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
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

export function ProvidersWithOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <ToastProvider>
        <OnboardingHandlerWrapper />
        {children}
        <ToastContainer />
      </ToastProvider>
    </OnboardingProvider>
  );
}
