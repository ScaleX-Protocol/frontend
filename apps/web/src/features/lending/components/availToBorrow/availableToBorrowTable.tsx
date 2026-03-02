import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { AvailableToBorrow, InterestRateParams, LendingSummary } from '../../types/lending.types';
import BorrowModal from '../modals/borrowModal';
import BorrowDetailsModal from '../modals/borrowDetailsModal';
import { TokenIcon } from '@/components/common/TokenIcon';
import { useCurrencies } from '@scalex/api';
import { logger } from '@/utils/prodLogger';

// Create contextual logger for AvailableToBorrowTable component
const log = logger.withContext({ component: 'AvailableToBorrowTable' });

// Helper to format large numbers to K/M format
const formatLiquidity = (value: string | undefined, asset: string): { formatted: string; amount: string } => {
  if (!value) return { formatted: '0', amount: '0' };
  const num = parseFloat(value.replace(/[$,]/g, ''));
  if (isNaN(num)) return { formatted: '0', amount: '0' };

  if (num >= 1000000) {
    return { formatted: `${(num / 1000000).toFixed(2)}M ${asset}`, amount: num.toLocaleString() };
  } else if (num >= 1000) {
    return { formatted: `${Math.floor(num).toLocaleString()} ${asset}`, amount: num.toLocaleString() };
  }
  return { formatted: `${num.toFixed(0)} ${asset}`, amount: num.toString() };
};

interface AvailableToBorrowTableProps {
  data: AvailableToBorrow[];
  chainId: number;
  interestRateParams?: InterestRateParams[];
  summary?: LendingSummary | null;
  isLoading?: boolean;
  error?: Error | null;
  variant?: 'desktop' | 'mobile';
  onDataRefresh?: () => void;
}

export default function AvailableToBorrowTable({
  data,
  chainId,
  interestRateParams,
  summary = null,
  isLoading = false,
  error = null,
  variant = 'desktop',
  onDataRefresh,
}: AvailableToBorrowTableProps) {
  console.log('available to borrow data ', data);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AvailableToBorrow | null>(null);

  // Find the interest rate params for the selected asset
  const selectedAssetInterestParams = selectedAsset
    ? interestRateParams?.find(params => params.tokenAddress.toLowerCase() === selectedAsset.assetAddress.toLowerCase())
    : null;

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies();

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  const TableHeader = () => (
    <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
      <div className="flex-2 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-left">Asset</div>
      <div className="flex-2 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-left">Liquidity</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">LTV / LT</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Supply APY</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Borrow APY</div>
      <div className="flex-2 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Action</div>
    </div>
  );

  // Mobile Variant - check FIRST before any desktop states
  if (variant === 'mobile') {
    // Mobile loading state
    if (isLoading) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <span className="text-[#666666] text-sm">Sort by APY ↕</span>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
          </div>
        </div>
      );
    }

    // Mobile empty state
    if (data.length === 0) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <span className="text-[#666666] text-sm">Sort by APY ↕</span>
          </div>
          <div className="flex items-center justify-center py-8 text-[#666666]">
            No assets available to borrow
          </div>
        </div>
      );
    }

    // Mobile data state - Card Layout
    return (
      <div className="flex flex-col gap-3 pb-[72px]">
        {/* Sort by APY */}
        <div className="flex justify-end">
          <button type="button" className="text-[#666666] text-sm flex items-center gap-1">
            Sort by APY
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L9 5H3L6 2Z" fill="#666666" />
              <path d="M6 10L3 7H9L6 10Z" fill="#666666" />
            </svg>
          </button>
        </div>

        {/* Asset Cards */}
        {data.map((asset, i) => {
          const borrowAPY = asset.realTimeRates?.borrowAPY || asset.apy || '0%';
          const liquidity = formatLiquidity(asset.availableLiquidity, asset.asset);

          return (
            <div
              key={asset.assetAddress || i}
              className="bg-[#111111] rounded-[24px] p-4 flex flex-col gap-4 border border-[#222222]"
            >
              {/* Header: Token + APY */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={asset.asset} size="lg" />
                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-sm leading-[20px]">{asset.asset}</span>
                    <span className="text-[#666666] text-xs leading-[16px]">{asset.asset}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[#E26B1D] font-medium text-sm leading-[20px]">{borrowAPY}</span>
                  <span className="text-[#555555] text-[10px] leading-[15px]">APY</span>
                </div>
              </div>

              {/* Liquidity Row */}
              <div className="bg-[#0A0A0A] rounded-[12px] px-3 py-2 flex justify-between items-center border border-[#1A1A1A]">
                <span className="text-[#666666] text-xs leading-[16px]">Liquidity</span>
                <span className="text-white text-xs leading-[16px] font-semibold">{liquidity.formatted}</span>
              </div>

              {/* Actions Row */}
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setBorrowOpen(true);
                  }}
                  disabled={!asset.canBorrow}
                  className="flex-1 py-2.5 bg-white text-black font-semibold text-xs leading-[16px] rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Borrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setDetailsOpen(true);
                  }}
                  className="w-9 h-9 rounded-[12px] border border-[#333333] flex items-center justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#666666" strokeWidth="1.5" />
                    <path d="M8 7V11" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="5" r="0.75" fill="#666666" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        <BorrowModal
          isOpen={borrowOpen}
          onClose={() => {
            setBorrowOpen(false);
            setSelectedAsset(null);
          }}
          selectedAsset={selectedAsset}
          summary={summary}
          currencies={availableCurrencies}
          currenciesLoading={currenciesLoading}
          onBalanceUpdate={onDataRefresh || (() => log.info('Balance updated'))}
        />

        <BorrowDetailsModal
          isOpen={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          interestRateParams={selectedAssetInterestParams}
        />
      </div>
    );
  }

  // Desktop Loading state
  if (isLoading) {
    return (
      <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] flex-1 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
            Asset To Borrow
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
            <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading available assets...</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Error state
  if (error) {
    return (
      <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] flex-1 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
            Asset To Borrow
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[#E0E0E0] font-medium">Failed to load data</span>
            <span className="text-[#666666] text-sm font-dm-sans">{error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Empty state
  if (data.length === 0) {
    return (
      <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] flex-1 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
            Asset To Borrow
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
            <span className="text-[#A0A0A0] text-sm font-dm-sans">No assets available to borrow</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Data state
  return (
    <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] flex-1 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
        <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
          Asset To Borrow
        </span>
        <button
          type="button"
          className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="flex flex-col">
        <TableHeader />
        {/* Data rows */}
        <div className="flex flex-col">
          {data.map((asset, i) => {
            // Format liquidity
            const liquidity = formatLiquidity(asset.availableLiquidity, asset.asset);
            const supplyAPY = asset.realTimeRates?.supplyAPY || '0%';
            const borrowAPY = asset.realTimeRates?.borrowAPY || asset.apy || '0%';

            return (
              <div
                key={asset.assetAddress || i}
                className="flex flex-row items-center hover:bg-[#141414] transition-colors"
              >
                {/* Asset */}
                <div className="flex-2 px-6 py-3">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={asset.asset} />
                    <span className="text-[#E0E0E0] font-dm-sans">{asset.asset}</span>
                  </div>
                </div>

                {/* Liquidity */}
                <div className="flex-2 px-6 py-3">
                  <p className="text-[#E0E0E0] text-sm font-medium">{liquidity.formatted}</p>
                </div>

                {/* LTV / LT */}
                <div className="flex-1 px-6 py-3 text-center">
                  <span className="text-[#E0E0E0] text-sm">
                    {asset.collateralFactor}% / {asset.liquidationThreshold}%
                  </span>
                </div>

                {/* Supply APY */}
                <div className="flex-1 px-6 py-3 text-center">
                  <span className="text-green-400 text-sm font-medium">{supplyAPY}</span>
                </div>

                {/* Borrow APY */}
                <div className="flex-1 px-6 py-3 text-center">
                  <span className="text-[#F06718] text-sm font-medium">{borrowAPY}</span>
                </div>

                {/* Actions */}
                <div className="flex-2 px-6 py-3 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setBorrowOpen(true);
                    }}
                    disabled={!asset.canBorrow}
                    className="px-4 py-1.5 bg-[#F06718] hover:bg-[#D85A14] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setDetailsOpen(true);
                    }}
                    className="px-4 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#E0E0E0] text-xs rounded-md transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BorrowModal
        isOpen={borrowOpen}
        onClose={() => {
          setBorrowOpen(false);
          setSelectedAsset(null);
        }}
        selectedAsset={selectedAsset}
        summary={summary}
        currencies={availableCurrencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={onDataRefresh || (() => log.info('Balance updated'))}
      />

      <BorrowDetailsModal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        interestRateParams={selectedAssetInterestParams}
      />
    </div>
  );
}
