import { X } from 'lucide-react';
import type { AvailableToBorrow, InterestRateParams } from '../types/lending.types';
import InterestRateChart from './interestRateChart';
import { TokenIcon } from './tokenIcon';

interface BorrowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AvailableToBorrow | null;
  interestRateParams?: InterestRateParams | null;
}

export default function BorrowDetailsModal({ isOpen, onClose, asset, interestRateParams }: BorrowDetailsModalProps) {
  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={`gs${asset.asset}`} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-white">{asset.asset}</h2>
              <p className="text-sm text-gray-400">Borrow Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Available to Borrow</p>
              <p className="text-2xl font-bold text-white">{asset.availableAmount}</p>
            </div>
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Variable APY</p>
              <p className="text-2xl font-bold text-green-400">{asset.apy}</p>
            </div>
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Collateral Factor</p>
              <p className="text-2xl font-bold text-white">{asset.collateralFactor}%</p>
            </div>
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Liquidation Threshold</p>
              <p className="text-2xl font-bold text-white">{asset.liquidationThreshold}%</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Risk Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Risk Parameters</h3>
              <div className="bg-[#2C2C2C] rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Utilization Rate</span>
                  <span className="text-white font-medium">{asset.utilizationRate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Current Borrowed</span>
                  <span className="text-white font-medium">{asset.currentBorrowed}</span>
                </div>
              </div>

              {/* Real-time Rates */}
              {asset.realTimeRates && (
                <>
                  <h3 className="text-lg font-semibold text-white">Real-time Rates</h3>
                  <div className="bg-[#2C2C2C] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Supply APY</span>
                      <span className="text-green-400 font-medium">{asset.realTimeRates.supplyAPY}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Borrow APY</span>
                      <span className="text-green-400 font-medium">{asset.realTimeRates.borrowAPY}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Utilization Rate</span>
                      <span className="text-white font-medium">{asset.realTimeRates.utilizationRate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Interest Rate Curve */}
            {interestRateParams && (
              <div className="col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-white">Interest Rate Curve</h3>
                <div className="bg-[#2C2C2C] rounded-lg p-4 min-h-[400px]">
                  <InterestRateChart interestRateParams={interestRateParams} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-3 gap-6">
            {/* Projected Interest */}
            {asset.projectedInterest && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Projected Interest (per $1,000)</h3>
                <div className="bg-[#2C2C2C] rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 mb-1">Hourly</span>
                    <span className="text-white font-medium">{asset.projectedInterest.hourly}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 mb-1">Daily</span>
                    <span className="text-white font-medium">{asset.projectedInterest.daily}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 mb-1">Weekly</span>
                    <span className="text-white font-medium">{asset.projectedInterest.weekly}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 mb-1">Monthly</span>
                    <span className="text-white font-medium">{asset.projectedInterest.monthly}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Address */}
            <div className={`${asset.projectedInterest ? 'col-span-2' : 'col-span-3'} space-y-2`}>
              <h3 className="text-sm text-gray-400">Contract Address</h3>
              <div className="bg-[#2C2C2C] rounded-lg p-3">
                <p className="text-sm text-white font-mono break-all">{asset.assetAddress}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              Borrow {asset.asset}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}