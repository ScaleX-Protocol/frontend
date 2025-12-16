'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useOnboarding, OnboardingProvider } from '@/hooks/useOnboarding';
import { useNativeTokenFaucet } from '@/features/faucet/hooks/useNativeTokenFaucet';
import { ToastProvider } from '@/hooks/useToast';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { ChainConfig } from '@/configs/chain';

function OnboardingHandler() {
  const { user, ready } = usePrivy();
  const { showOnboarding, completeOnboarding, isOnboardingOpen } = useOnboarding();

  // Only enable faucet check when Privy is ready and user has a wallet
  // This ensures wagmi context is available before useNativeTokenFaucet tries to use it
  const shouldCheckFaucet = ready && !!user?.wallet?.address;

  // Check native token balance and request from faucet if needed
  useNativeTokenFaucet({
    address: user?.wallet?.address,
    chainId: ChainConfig.defaultChainId,
    enabled: shouldCheckFaucet,
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

export function ProvidersWithOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <ToastProvider>
        <OnboardingHandler />
        {children}
        <ToastContainer />
      </ToastProvider>
    </OnboardingProvider>
  );
}
