import { X } from 'lucide-react';
import type { AvailableToBorrow, InterestRateParams } from '../../types/lending.types';
import InterestRateChart from '../interestRateChart';
import { TokenIcon } from '../tokenIcon';

interface BorrowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AvailableToBorrow | null;
  interestRateParams?: InterestRateParams | null;
}

export default function BorrowDetailsModal({ isOpen, onClose, asset, interestRateParams }: BorrowDetailsModalProps) {
  if (!isOpen || !asset) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl w-full max-w-5xl flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A3A] shrink-0">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={`gs${asset.asset}`} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">{asset.asset}</h2>
              <p className="text-sm text-[#A0A0A0]">Borrow Details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors p-1 rounded-lg hover:bg-[#3A3A3A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Key Metrics - 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3">
              <p className="text-xs text-[#A0A0A0] mb-1">Available to Borrow</p>
              <p className="text-lg font-bold text-[#E0E0E0]">{asset.availableAmount}</p>
            </div>
            <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3">
              <p className="text-xs text-[#A0A0A0] mb-1">Variable APY</p>
              <p className="text-lg font-bold text-green-400">{asset.apy}</p>
            </div>
            <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3">
              <p className="text-xs text-[#A0A0A0] mb-1">Collateral Factor</p>
              <p className="text-lg font-bold text-[#E0E0E0]">{asset.collateralFactor}%</p>
            </div>
            <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3">
              <p className="text-xs text-[#A0A0A0] mb-1">Liquidation Threshold</p>
              <p className="text-lg font-bold text-[#E0E0E0]">{asset.liquidationThreshold}%</p>
            </div>
          </div>

          {/* Main Content Grid - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left Column - Parameters (2/5) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Risk Parameters */}
              <div>
                <h3 className="text-sm font-semibold text-[#E0E0E0] mb-2">Risk Parameters</h3>
                <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#A0A0A0] text-sm">Utilization Rate</span>
                    <span className="text-[#E0E0E0] font-medium text-sm">{asset.utilizationRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#A0A0A0] text-sm">Current Borrowed</span>
                    <span className="text-[#E0E0E0] font-medium text-sm">{asset.currentBorrowed}</span>
                  </div>
                </div>
              </div>

              {/* Real-time Rates */}
              {asset.realTimeRates && (
                <div>
                  <h3 className="text-sm font-semibold text-[#E0E0E0] mb-2">Real-time Rates</h3>
                  <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0] text-sm">Supply APY</span>
                      <span className="text-green-400 font-medium text-sm">{asset.realTimeRates.supplyAPY}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0] text-sm">Borrow APY</span>
                      <span className="text-green-400 font-medium text-sm">{asset.realTimeRates.borrowAPY}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0] text-sm">Utilization Rate</span>
                      <span className="text-[#E0E0E0] font-medium text-sm">{asset.realTimeRates.utilizationRate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Projected Interest - Compact Grid */}
              {asset.projectedInterest && (
                <div>
                  <h3 className="text-sm font-semibold text-[#E0E0E0] mb-2">Projected Interest (per $1,000)</h3>
                  <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-[#A0A0A0]">Hourly</span>
                      <p className="text-[#E0E0E0] font-medium text-sm">{asset.projectedInterest.hourly}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#A0A0A0]">Daily</span>
                      <p className="text-[#E0E0E0] font-medium text-sm">{asset.projectedInterest.daily}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#A0A0A0]">Weekly</span>
                      <p className="text-[#E0E0E0] font-medium text-sm">{asset.projectedInterest.weekly}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#A0A0A0]">Monthly</span>
                      <p className="text-[#E0E0E0] font-medium text-sm">{asset.projectedInterest.monthly}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Interest Rate Curve (3/5) */}
            {interestRateParams && (
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-[#E0E0E0] mb-2">Interest Rate Curve</h3>
                <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-4">
                  <InterestRateChart
                    interestRateParams={interestRateParams}
                    currentUtilizationRate={asset.realTimeRates?.utilizationRate || asset.utilizationRate}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer - Always Visible */}
        <div className="shrink-0 px-6 py-4 border-t border-[#3A3A3A] bg-[#1A1A1A]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#F06718] hover:bg-[#D85A14] text-white rounded-lg font-medium transition-colors"
            >
              Borrow {asset.asset}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#E0E0E0] rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}