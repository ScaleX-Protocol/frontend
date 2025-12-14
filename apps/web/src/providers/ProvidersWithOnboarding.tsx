'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useOnboarding, OnboardingProvider } from '@/hooks/useOnboarding';
import { useNativeTokenFaucet } from '@/features/faucet/hooks/useNativeTokenFaucet';
import { ToastProvider } from '@/hooks/useToast';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { ChainConfig } from '@/configs/chain';
import { Providers } from './privyProvider';

function OnboardingHandler() {
  const { user, ready } = usePrivy();
  const { showOnboarding, completeOnboarding, isOnboardingOpen } = useOnboarding();

  // Check native token balance and request from faucet if needed
  useNativeTokenFaucet({
    address: user?.wallet?.address,
    chainId: ChainConfig.defaultChainId,
    enabled: ready && !!user?.wallet?.address,
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
    <Providers>
      <OnboardingProvider>
        <ToastProvider>
          <OnboardingHandler />
          {children}
          <ToastContainer />
        </ToastProvider>
      </OnboardingProvider>
    </Providers>
  );
}
