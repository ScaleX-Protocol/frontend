'use client';

import OnboardingModal from '@/components/OnboardingModal';
import { useOnboarding } from '@/hooks/useOnboarding';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { Providers } from './privyProvider';

function OnboardingHandler() {
  const { user, ready } = usePrivy();
  const { showOnboarding, completeOnboarding, isOnboardingOpen, setIsOnboardingOpen } = useOnboarding();

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
  }, [user?.wallet?.address, ready]);

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
      <OnboardingHandler />
      {children}
    </Providers>
  );
}
