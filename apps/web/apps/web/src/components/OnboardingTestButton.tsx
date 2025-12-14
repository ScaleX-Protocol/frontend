'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { Play } from 'lucide-react';

/**
 * Optional test component to manually trigger onboarding
 * Remove this after testing - it's only for development
 */
export default function OnboardingTestButton() {
  const { resetOnboarding, setIsOnboardingOpen } = useOnboarding();

  const handleClick = () => {
    resetOnboarding();
    // Use setTimeout to ensure the state update happens after resetOnboarding
    setTimeout(() => {
      setIsOnboardingOpen(true);
    }, 0);
  };

  return (
    <button
      onClick={handleClick}
      className="bg-transparent hover:bg-black/30 text-white px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 flex items-center space-x-2"
    >
      <Play className="w-5 h-5" />
      <span className="font-medium text-sm">Onboarding</span>
    </button>
  );
}
