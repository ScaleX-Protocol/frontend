'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    id: 1,
    title: 'Deposit Assets',
    description: 'Start by depositing your assets to the platform. This is your first step to unlock all trading opportunities and begin earning rewards.',
    icon: '💰',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    title: 'Trade & Earn',
    description: 'Execute trades whenever opportunities arise. Earn rewards on your trades and watch your portfolio grow with every transaction.',
    icon: '📈',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 3,
    title: 'Borrow & Manage Risk',
    description: 'Access borrowing features and set stop-loss limits for borrowed assets. Manage your risk effectively with advanced controls.',
    icon: '🎯',
    color: 'from-orange-500 to-orange-600',
  },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const progressBarsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const tl = gsap.timeline();

    // Fade in backdrop
    tl.from(containerRef.current, {
      opacity: 0,
      duration: 0.3,
    });

    // Scale in modal
    tl.from(
      modalRef.current,
      {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: 'back.out',
      },
      0
    );

    // Animate progress bars
    progressBarsRef.current.forEach((bar, index) => {
      if (bar) {
        tl.from(
          bar,
          {
            width: 0,
            duration: 0.5,
            ease: 'power2.out',
          },
          0.3 + index * 0.1
        );
      }
    });

    // Animate content
    tl.from(
      contentRef.current,
      {
        y: 20,
        opacity: 0,
        duration: 0.4,
      },
      0.5
    );
  }, [isOpen]);

  // Animate step transitions
  useEffect(() => {
    if (!contentRef.current || !isOpen) return;

    const tl = gsap.timeline();

    tl.to(contentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
    });

    tl.to(
      contentRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      },
      0.15
    );
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-2 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors z-50"
        >
          <X size={20} className="text-slate-400 hover:text-white" />
        </button>

        {/* Content */}
        <div ref={contentRef} className="p-8">
          {/* Step Counter */}
          <div className="text-sm font-semibold text-orange-500 mb-4">
            STEP {currentStep + 1} OF {STEPS.length}
          </div>

          {/* Icon */}
          <div className="mb-6">
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl shadow-lg`}
            >
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed mb-8">{step.description}</p>

          {/* Progress Indicators */}
          <div className="flex gap-2 mb-8">
            {STEPS.map((_, index) => (
              <div
                key={index}
                ref={(el) => {
                  progressBarsRef.current[index] = el;
                }}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  index <= currentStep ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (currentStep < STEPS.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  onClose();
                }
              }}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/50 transition-all font-medium flex items-center justify-center gap-2"
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <CheckCircle2 size={18} />
                  Got It!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500" />
      </div>
    </div>
  );
}
