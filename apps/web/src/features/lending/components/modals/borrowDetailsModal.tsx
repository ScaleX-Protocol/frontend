import { X, Info, ShieldAlert, BarChart2, Copy, ExternalLink, TriangleAlert, Wallet } from 'lucide-react';
import type { AvailableToBorrow, InterestRateParams } from '../../types/lending.types';
import ModalWrapper from '@/components/modals/modalWrapper';
import InterestRateChart from '../interestRateChart';
import { TokenIcon } from '@/components/common/TokenIcon';

interface BorrowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AvailableToBorrow | null;
  interestRateParams?: InterestRateParams | null;
}

export default function BorrowDetailsModal({ isOpen, onClose, asset, interestRateParams }: BorrowDetailsModalProps) {
  if (!isOpen || !asset) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Borrow ${asset.asset}`}
      subtitle="Ethereum Network"
      customIcon={
        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center overflow-hidden shrink-0">
          <TokenIcon symbol={asset.asset} size="lg" />
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="px-5 py-6 space-y-6">

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-4 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] text-[#888888] font-medium leading-[16px]">Available</span>
              <Info size={12} className="text-[#888888]" />
            </div>
            <span className="text-xl font-semibold text-[#FFFFFF] leading-[28px]">{asset.availableAmount || '$14.2M'}</span>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-4 flex flex-col justify-center gap-1.5">
            <span className="text-[12px] text-[#888888] font-medium leading-[16px] mb-1">Variable APY</span>
            <span className="text-xl font-semibold text-[#2ECC71] leading-[28px]">{asset.apy}</span>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-4 flex flex-col justify-center gap-1.5">
            <span className="text-[12px] text-[#888888] font-medium leading-[16px] mb-1">Collateral Factor</span>
            <span className="text-xl font-semibold text-[#FFFFFF] leading-[28px]">{asset.collateralFactor}%</span>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-4 flex flex-col justify-center gap-1.5">
            <span className="text-[12px] text-[#888888] font-medium leading-[16px] mb-1">Liquidation</span>
            <span className="text-xl font-semibold text-[#FFFFFF] leading-[28px]">{asset.liquidationThreshold}%</span>
          </div>
        </div>

        {/* Interest Rate Curve block */}
        {interestRateParams && (
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-[24px] p-5">
            <h3 className="text-[14px] font-semibold text-[#FFFFFF] mb-3 leading-[20px]">Interest Rate Curve</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#F06718]" />
                <span className="text-[12px] text-[#888888]">Current ({asset.realTimeRates?.utilizationRate || asset.utilizationRate})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#444444]" />
                <span className="text-[12px] text-[#888888]">Optimal ({interestRateParams?.optimalUtilization || '80%'})</span>
              </div>
            </div>
            {/* Chart */}
            <div className="h-[180px] w-full relative -ml-1 mt-2">
              <InterestRateChart
                interestRateParams={interestRateParams}
                currentUtilizationRate={asset.realTimeRates?.utilizationRate || asset.utilizationRate}
              />
            </div>
          </div>
        )}

        {/* Risk Parameters */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-[#E26B1D]" />
            <h3 className="text-[14px] font-semibold text-[#FFFFFF]">Risk Parameters</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888888]">Utilization Rate</span>
              <span className="text-[13px] font-medium text-[#FFFFFF]">{asset.realTimeRates?.utilizationRate || asset.utilizationRate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888888]">Current Borrowed</span>
              <span className="text-[13px] font-medium text-[#FFFFFF]">{asset.currentBorrowed}</span>
            </div>
          </div>
        </div>

        {/* Real-time Rates */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-[20px] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-[#E26B1D]" />
            <h3 className="text-[14px] font-semibold text-[#FFFFFF]">Real-time Rates</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888888]">Supply APY</span>
              <span className="text-[13px] font-medium text-[#2ECC71]">{asset.realTimeRates?.supplyAPY || '0.15%'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888888]">Borrow APY</span>
              <span className="text-[13px] font-medium text-[#2ECC71]">{asset.realTimeRates?.borrowAPY || '2.75%'}</span>
            </div>
          </div>
        </div>

        {/* Projected Interest */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-[14px] font-semibold text-[#FFFFFF] leading-[20px]">Projected Interest <span className="text-[#666666] font-normal tracking-wide">(per $1000)</span></h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[14px] text-[#888888]">Hourly</span>
              <span className="text-[14px] font-medium text-[#FFFFFF]">{asset.projectedInterest?.hourly || '$0.01'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[14px] text-[#888888]">Daily</span>
              <span className="text-[14px] font-medium text-[#FFFFFF]">{asset.projectedInterest?.daily || '$0.14'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[14px] text-[#888888]">Weekly</span>
              <span className="text-[14px] font-medium text-[#FFFFFF]">{asset.projectedInterest?.weekly || '$0.96'}</span>
            </div>
          </div>
        </div>

        {/* Contract */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 cursor-pointer group">
            <span className="text-[14px] font-semibold text-[#888888] group-hover:text-[#FFFFFF] transition-colors">Contract</span>
            <Copy size={14} className="text-[#666666] group-hover:text-[#888888]" />
          </div>
          <div className="flex items-center gap-1.5 bg-[#161616] border border-[#222222] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#1A1A1A] transition-colors">
            <span className="text-[12px] text-[#A0A0A0] font-mono">0xA0b8...eB48</span>
            <ExternalLink size={12} className="text-[#666666]" />
          </div>
        </div>

        {/* Warning */}
        <div className="bg-[#E26B1D]/10 border border-[#E26B1D]/20 rounded-[16px] p-4 flex gap-3 items-start mt-2">
          <TriangleAlert size={16} className="text-[#E26B1D] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#E26B1D]/90 leading-[20px]">
            Borrowing increases your liquidation risk. Monitor your health factor closely to avoid liquidation.
          </p>
        </div>

        {/* Sticky Footer */}
        <div className="w-full bg-[#0C0C0C] border-t border-[#1F1F1F] flex flex-col gap-4 p-6 shrink-0 mt-auto">
          <div className="flex justify-between items-center px-1">
            <span className="text-[#888888] text-[13px]">Projected Interest (30d)</span>
            <span className="text-[#FFFFFF] text-[15px] font-semibold">{asset.projectedInterest?.monthly || '~$12.40'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-[52px] rounded-full text-[15px] font-semibold transition-all text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #F06718 0%, #F5955D 100%)' }}
          >
            <Wallet size={18} />
            Borrow {asset.asset}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}