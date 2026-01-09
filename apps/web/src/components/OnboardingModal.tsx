'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import OnboardingAnimation from './OnboardingAnimation';

interface ScaleXAdvantageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScaleXAdvantageModal({ isOpen, onClose }: ScaleXAdvantageModalProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [runInterval, setRunInterval] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep < 3 && runInterval) {
          return (prevStep + 1) as 1 | 2 | 3;
        }
        return prevStep;
      });
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [isOpen, runInterval]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
      onClick={() => !isAgreed && onClose()}
    >
      <div
        className="bg-[#2C2C2C] rounded-lg shadow-2xl w-full max-w-[1019px] p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '589px' }}
      >
        <div className="flex flex-col gap-10">
          <span className="font-bold text-2xl text-[#E0E0E0]">The ScaleX Advantage: Trade While Earning Yield</span>

          <div className="flex flex-row gap-10">
            <OnboardingAnimation step={step} />

            <div className="w-fit flex flex-col gap-10">
              <div
                onClick={() => {
                  setStep(1);
                  setRunInterval(false);
                }}
                className={`flex gap-4 cursor-default ${step === 1 ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              >
                <span className="font-semibold text-[#E0E0E0] w-[22px]">01</span>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#E0E0E0] leading-tight">Deposit & Auto-Earn Yield</span>
                  <span className="text-[#E0E0E0]/80 w-[600px] leading-tight">
                    Fund your portfolio, and your capital—including funds in active limit orders—is automatically lent
                    out to earn continuous yield. Your capital works 24/7.
                  </span>
                </div>
              </div>
              <div
                onClick={() => {
                  setStep(2);
                  setRunInterval(false);
                }}
                className={`flex gap-4 cursor-default ${step === 2 ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              >
                <span className="font-semibold text-[#E0E0E0] w-[22px]">02</span>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#E0E0E0] leading-tight">Trade with Unified Power</span>
                  <span className="text-[#E0E0E0]/80 w-[600px] leading-tight">
                    Place trades on our Order Book using your portfolio as collateral. Access instant leverage and
                    borrowing power without ever moving assets between separate protocols.
                  </span>
                </div>
              </div>
              <div
                onClick={() => {
                  setStep(3);
                  setRunInterval(false);
                }}
                className={`flex gap-4 cursor-default ${step === 3 ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              >
                <span className="font-semibold text-[#E0E0E0] w-[22px]">03</span>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#E0E0E0] leading-tight">Protect & Optimize Costs</span>
                  <span className="text-[#E0E0E0]/80 w-[600px] leading-tight">
                    Place strategic orders to serve as automatic, zero-slippage liquidation protection. Plus,
                    automatically repay loans at optimal lower prices to reduce the cost of your leverage.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="w-full border border-t-[#E0E0E0]/20"></div>
            <span className="text-[#E0E0E0] text-xs leading-tight cursor-default">
              ScaleX is committed to industry-leading security practices, but all DeFi interactions carry inherent
              risks, including smart contract vulnerabilities, market volatility, and the unique dynamics of a unified
              CLOB-Lending protocol. Learn more in our documentation.
            </span>
            <div className="flex items-center justify-between">
              <label
                htmlFor="agree-tos"
                className="flex items-start cursor-pointer gap-2"
                onClick={(e) => e.preventDefault()}
              >
                <div
                  className={`shrink-0 w-4 h-4 ${
                    isAgreed ? 'bg-[#7CC956]' : 'bg-[#D9D9D9]'
                  } rounded transition-colors duration-150 flex items-start justify-center mt-0.5`}
                  onClick={() => setIsAgreed(!isAgreed)}
                >
                  <input
                    type="checkbox"
                    id="agree-tos"
                    checked={isAgreed}
                    onChange={() => setIsAgreed(!isAgreed)}
                    className="sr-only"
                  />
                  <Check
                    size={16}
                    className={`text-[#E0E0E0] transition-opacity duration-150 ${
                      isAgreed ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
                <span className="text-xs text-[#E0E0E0] w-lg leading-tight" onClick={() => setIsAgreed(!isAgreed)}>
                  Check this box to confirm you have read the ScaleX Terms of Use and understand the associated risks,
                  including our unique Order Book Liquidation Protection mechanism.
                </span>
              </label>

              <button
                type='button'
                onClick={() => onClose()}
                disabled={!isAgreed}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-md bg-[#F06718]/70 text-[#E0E0E0] ${
                  !isAgreed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F06718]/80'
                }`}
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
