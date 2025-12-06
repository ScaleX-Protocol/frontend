'use client';

import { useOnboarding } from '@/hooks/useOnboarding';

/**
 * Optional test component to manually trigger onboarding
 * Remove this after testing - it's only for development
 */
export default function OnboardingTestButton() {
  const { resetOnboarding, showOnboarding } = useOnboarding();

  return (
    <div className="fixed w-full bottom-4 left-0 z-30 flex gap-2 justify-center items-center">
      <button
        onClick={() => {
          resetOnboarding();
          showOnboarding();
        }}
        className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
      >
        Reset Onboarding (Dev)
      </button>
    </div>
  );
}
