import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { useSidebarTour, TOUR_STEPS } from '@/hooks/useSidebarTour';
import { useSidebar } from '@/providers/SidebarContext';
import TourOverlay from './TourOverlay';
import TourPopover from './TourPopover';

export default function SidebarTour() {
  const { isTourActive, currentStep, totalSteps, nextStep, prevStep, skipTour } = useSidebarTour();
  const { isCollapsed, setCollapsed } = useSidebar();
  const { authenticated, login } = usePrivy();
  const navigate = useNavigate();
  const prevCollapsedRef = useRef(isCollapsed);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  // Save sidebar state when tour starts, restore when it ends
  useEffect(() => {
    if (isTourActive) {
      prevCollapsedRef.current = isCollapsed;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);

  // Force expand sidebar when on sidebar steps (1-8)
  useEffect(() => {
    if (!isTourActive) return;
    if (currentStep >= 1 && isCollapsed) {
      setCollapsed(false);
    }
  }, [isTourActive, currentStep, isCollapsed, setCollapsed]);

  // Navigate to the corresponding page when step changes
  useEffect(() => {
    if (!isTourActive) return;
    const step = TOUR_STEPS[currentStep];
    if (step?.path) {
      navigate({ to: step.path });
    }
  }, [isTourActive, currentStep, navigate]);

  // Elevate the entire sidebar above the overlay so nav items stay interactive and visible
  useEffect(() => {
    if (!isTourActive) return;
    if (currentStep === 0) return;

    // The sidebar <aside> is the parent with z-50 and overflow-hidden.
    // We need to lift it above the overlay (z-9998) so the cutout reveals real content.
    const sidebar = document.querySelector('aside') as HTMLElement | null;
    if (!sidebar) return;

    const prevZ = sidebar.style.zIndex;
    sidebar.style.zIndex = '9999';

    return () => {
      sidebar.style.zIndex = prevZ;
    };
  }, [isTourActive, currentStep]);

  // Restore sidebar state when tour ends
  useEffect(() => {
    if (!isTourActive && prevCollapsedRef.current) {
      setCollapsed(prevCollapsedRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);

  // Navigate to overview on tour completion/skip
  const handleComplete = useCallback(() => {
    skipTour();
    navigate({ to: '/overview' });
  }, [skipTour, navigate]);

  const handleNext = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      handleComplete();
      return;
    }
    nextStep();
  }, [currentStep, totalSteps, nextStep, handleComplete]);

  // Position popover to match tooltip: right of the Link element inside the li, offset 8px
  useEffect(() => {
    if (!isTourActive) return;

    if (currentStep === 0) {
      setPopoverPos(null);
      return;
    }

    const updatePosition = () => {
      const li = document.querySelector(`[data-tour-step="${currentStep}"]`);
      if (!li) return;
      // Use the Link/anchor inside the li (the tooltip trigger wraps it)
      const link = li.querySelector('a') || li;
      const rect = link.getBoundingClientRect();
      // Match tooltip positioning exactly: right + 8, vertically centered
      setPopoverPos({
        top: rect.top + rect.height / 2 - 32,
        left: rect.right + 8,
      });
    };

    // Delay to let sidebar expand animation and navigation settle
    const timer = setTimeout(updatePosition, 250);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isTourActive, currentStep]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isTourActive) return;
      if (e.key === 'Escape') handleComplete();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') prevStep();
    },
    [isTourActive, handleComplete, handleNext, prevStep]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isTourActive) return null;

  const isWelcomeStep = currentStep === 0;

  return createPortal(
    <AnimatePresence mode="wait">
      {/* Overlay */}
      <TourOverlay targetStep={isWelcomeStep ? null : currentStep} />

      {/* Welcome step: centered card */}
      {isWelcomeStep ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          // transition={{ duration: 0.1 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <div className="w-[380px] bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-2xl text-center">
            <img
              src="/images/logo/ScaleX-Logo.png"
              alt="ScaleX"
              className="w-14 h-14 mx-auto mb-4 rounded-xl"
            />
            <h2 className="text-lg font-bold text-[#E0E0E0] mb-2">Welcome to ScaleX!</h2>
            <p className="text-sm text-[#888888] mb-6 leading-relaxed">
              Let&apos;s take a quick tour of the platform so you know where everything is.
            </p>

            {authenticated ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2.5 bg-[#F06718] hover:bg-[#D4580F] text-white text-sm font-medium rounded-xl transition-colors"
              >
                Let&apos;s Go
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => login()}
                  className="w-full py-2.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Connect Wallet
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#888888] text-sm font-medium rounded-xl transition-colors border border-[#222222]"
                >
                  Skip, just show me around
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleComplete}
              className="mt-3 text-xs text-[#555555] hover:text-[#888888] transition-colors"
            >
              Skip tour entirely
            </button>
          </div>
        </motion.div>
      ) : (
        /* Sidebar step popover */
        <TourPopover
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrev={prevStep}
          onSkip={handleComplete}
          position={popoverPos}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
