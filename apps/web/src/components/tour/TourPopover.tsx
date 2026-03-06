import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TOUR_STEPS } from '@/hooks/useSidebarTour';

interface TourPopoverProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position: { top: number; left: number } | null;
}

export default function TourPopover({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position,
}: TourPopoverProps) {
  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed w-[300px] bg-[#111111] border border-[#222222] rounded-xl p-4 shadow-2xl"
      style={{
        top: position ? position.top : '50%',
        left: position ? position.left : '50%',
        // transform: position ? 'translateY(-50%)' : 'translate(-50%, -50%)',
        zIndex: 9999,
      }}
    >
      {/* Arrow pointing to sidebar item — matches tooltip arrow style */}
      {position && (
        <div className="absolute right-full top-5 -translate-y-1/2 border-[5px] border-transparent border-r-[#222222]">
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#111111]" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#F06718]">
          {currentStep + 1} / {totalSteps}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="p-1 text-[#555555] hover:text-[#888888] transition-colors"
          aria-label="Skip tour"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <h3 className="text-sm font-semibold text-[#E0E0E0] mb-1">{step.label}</h3>
      <p className="text-xs text-[#888888] leading-relaxed mb-4">{step.description}</p>

      {/* Progress bar */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-[#F06718]' : 'bg-[#222222]'
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstStep}
          className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#E0E0E0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1 px-4 py-1.5 bg-[#F06718] hover:bg-[#D4580F] text-white text-xs font-medium rounded-lg transition-colors"
        >
          {isLastStep ? 'Finish' : 'Next'}
          {!isLastStep && <ChevronRight size={14} />}
        </button>
      </div>
    </motion.div>
  );
}
