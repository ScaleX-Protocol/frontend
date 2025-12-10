import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const ONBOARDING_KEY = 'scalex_onboarding_completed';

interface OnboardingContextType {
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  showOnboarding: () => void;
  completeOnboarding: () => void;
  hasSeenOnboarding: boolean;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
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

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen,
        setIsOnboardingOpen,
        showOnboarding,
        completeOnboarding,
        hasSeenOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
