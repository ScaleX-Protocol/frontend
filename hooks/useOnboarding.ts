import { useEffect, useState } from 'react';

const ONBOARDING_KEY = 'scalex_onboarding_completed';

export function useOnboarding() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // Default to true to prevent flickering

  // Initialize on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasSeenOnboarding(completed === 'true');
  }, []);

  // Show onboarding when user connects wallet for first time
  const showOnboarding = () => {
    if (!hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    }
  };

  // Mark onboarding as completed
  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
    setIsOnboardingOpen(false);
  };

  // Reset onboarding (for testing)
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasSeenOnboarding(false);
  };

  return {
    isOnboardingOpen,
    setIsOnboardingOpen,
    showOnboarding,
    completeOnboarding,
    hasSeenOnboarding,
    resetOnboarding,
  };
}
