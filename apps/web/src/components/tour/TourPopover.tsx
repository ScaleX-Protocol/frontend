import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(8px)' }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
      className="fixed w-[320px] bg-[#0c0c0c]/95 backdrop-blur-xl border border-white/8 rounded-2xl p-5 shadow-[0_0_40px_-10px_rgba(240,103,24,0.15)]"
      style={{
        top: position ? position.top : '50%',
        left: position ? position.left : '50%',
        zIndex: 9999,
      }}
    >
      {/* Decorative background glow */}
      {/* <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F06718]/15 rounded-full blur-[40px]" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F06718]/10 rounded-full blur-[30px]" />
      </div> */}

      {/* Arrow pointing to sidebar item */}
      {position && (
        <div
          className="absolute w-3.5 h-3.5 bg-[#0c0c0c] border-t border-l border-white/8 transform -rotate-45 rounded-[2px]"
          style={{ left: '-7px', top: '24px' }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F06718]/10 border border-[#F06718]/20">
            <Sparkles size={12} className="text-[#F06718]" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#F06718]">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
          aria-label="Skip tour"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-base font-semibold text-white mb-2 leading-tight tracking-tight">
              {step.label}
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      {/* <div className="relative z-10 flex gap-1.5 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full overflow-hidden bg-white/[0.05]"
          >
            <motion.div
              initial={false}
              animate={{
                backgroundColor: i <= currentStep ? '#F06718' : 'transparent',
                scaleX: i <= currentStep ? 1 : 0,
              }}
              className="w-full h-full origin-left"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
        ))}
      </div> */}

      {/* Actions */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstStep}
          className="flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none group"
        >
          <ChevronLeft size={16} className="transform group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-linear-to-r from-[#F06718] to-[#D4580F] hover:from-[#FF8A4C] hover:to-[#F06718] text-white text-sm font-semibold rounded-xl transition-all shadow-[0_4px_14px_rgba(240,103,24,0.3)] hover:shadow-[0_6px_20px_rgba(240,103,24,0.4)] active:scale-95 group relative overflow-hidden"
        >
          <span className="relative z-10">{isLastStep ? 'Get Started' : 'Next'}</span>
          {!isLastStep && (
            <ChevronRight size={16} className="relative z-10 transform group-hover:translate-x-0.5 transition-transform" />
          )}
          <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform ease-out duration-300 pointer-events-none" />
        </button>
      </div>
    </motion.div>
  );
}
