import { useMemo, useState } from 'react';
import type { AvailableToBorrow, InterestRateParams, LendingSummary } from '../../types/lending.types';
import BorrowModal from '../modals/borrowModal';
import BorrowDetailsModal from '../modals/borrowDetailsModal';
import { TokenIcon } from '@/components/common/TokenIcon';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
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
}

export default function AvailableToBorrowTable({
  data,
  chainId,
  interestRateParams,
  summary = null,
  isLoading = false,
  error = null,
}: AvailableToBorrowTableProps) {
  console.log('available to borrow data ', data);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AvailableToBorrow | null>(null);

  // Find the interest rate params for the selected asset
  const selectedAssetInterestParams = selectedAsset
    ? interestRateParams?.find(params => params.tokenAddress.toLowerCase() === selectedAsset.assetAddress.toLowerCase())
    : null;

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  // Table Header Component
  const TableHeader = () => (
    <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
      <div className="flex-2 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
      <div className="flex-2 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Liquidity</div>
      <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">LTV / LT</div>
      <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Supply APY</div>
      <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Borrow APY</div>
      <div className="flex-2 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center">Action</div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040] flex-1">
        <span className="text-[#E0E0E0] font-medium">Asset To Borrow</span>
        <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
          <TableHeader />
          {/* Loading content */}
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
            <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading available assets...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040] flex-1">
        <span className="text-[#E0E0E0] font-medium">Asset To Borrow</span>
        <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
          <TableHeader />
          {/* Error content */}
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040] flex-1">
        <span className="text-[#E0E0E0] font-medium">Asset To Borrow</span>
        <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
          <TableHeader />
          {/* Empty content */}
          <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
            <span className="text-[#A0A0A0] text-sm font-dm-sans">No assets available to borrow</span>
          </div>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040] flex-1">
      <span className="text-[#E0E0E0] font-medium">Asset To Borrow</span>
      <div className='w-full h-0.5 bg-[#3A3A3A]'></div>
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
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
                className="flex flex-row items-center hover:bg-[#2A2A2A] transition-colors"
              >
                {/* Asset */}
                <div className="flex-2 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={asset.asset} />
                    <span className="text-[#E0E0E0] font-dm-sans">{asset.asset}</span>
                  </div>
                </div>
                
                {/* Liquidity */}
                <div className="flex-2 px-4 py-3">
                  <p className="text-[#E0E0E0] text-sm font-medium">{liquidity.formatted}</p>
                </div>
                
                {/* LTV / LT */}
                <div className="flex-1 px-4 py-3 text-center">
                  <span className="text-[#E0E0E0] text-sm">
                    {asset.collateralFactor}% / {asset.liquidationThreshold}%
                  </span>
                </div>
                
                {/* Supply APY */}
                <div className="flex-1 px-4 py-3 text-center">
                  <span className="text-green-400 text-sm font-medium">{supplyAPY}</span>
                </div>
                
                {/* Borrow APY */}
                <div className="flex-1 px-4 py-3 text-center">
                  <span className="text-[#F06718] text-sm font-medium">{borrowAPY}</span>
                </div>
                
                {/* Actions */}
                <div className="flex-2 px-4 py-3 flex gap-2 justify-center">
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
        onBalanceUpdate={() => log.info('Balance updated')}
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
