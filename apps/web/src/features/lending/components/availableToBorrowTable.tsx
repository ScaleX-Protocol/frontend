import { useMemo, useState } from 'react';
import type { AvailableToBorrow, InterestRateParams, LendingSummary } from '../types/lending.types';
import BorrowModal from './borrowModal';
import BorrowDetailsModal from './borrowDetailsModal';
import { TokenIcon } from './tokenIcon';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
import { logger } from '@/utils/prodLogger';

// Create contextual logger for AvailableToBorrowTable component
const log = logger.withContext({ component: 'AvailableToBorrowTable' });

// Helper to format large numbers to K/M format
const formatLiquidity = (value: string | undefined): { amount: string; formatted: string } => {
  if (!value) return { amount: '0', formatted: '$0' };
  const num = parseFloat(value.replace(/[$,]/g, ''));
  if (isNaN(num)) return { amount: '0', formatted: '$0' };
  
  if (num >= 1000000) {
    return { amount: num.toLocaleString(), formatted: `$${(num / 1000000).toFixed(2)}M` };
  } else if (num >= 1000) {
    return { amount: num.toLocaleString(), formatted: `$${(num / 1000).toFixed(1)}k` };
  }
  return { amount: num.toLocaleString(), formatted: `$${num.toFixed(2)}` };
};

export default function AvailableToBorrowTable({
  data,
  chainId,
  interestRateParams,
  summary = null,
}: {
  data: AvailableToBorrow[];
  chainId: number;
  interestRateParams?: InterestRateParams[];
  summary?: LendingSummary | null;
}) {
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

  return (
    <div className="bg-[#2C2C2C] rounded-lg overflow-hidden flex-1">
      <div className="p-4 border-b border-[#3A3A3A]">
        <h2 className="text-[#E0E0E0] font-medium">Assets to borrow</h2>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_auto] gap-3 px-4 py-3 text-[#A0A0A0] text-xs border-b border-[#3A3A3A]">
        <span>Asset</span>
        <span>Liquidity</span>
        {/* <span>Utilization</span> */}
        <span className="text-center">LTV / LT</span>
        <span className="text-center">Supply APY</span>
        <span className="text-center">Borrow APY</span>
        <span className='text-center'>Actions</span>
      </div>

      {/* Table Body */}
      <div className="px-4 pb-4 max-h-80 overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-[#A0A0A0] text-sm py-8 text-center">No assets available to borrow</p>
        ) : (
          data.map((asset, i) => {
            const liquidity = formatLiquidity(asset.availableLiquidity);
            const supplyAPY = asset.realTimeRates?.supplyAPY || '0%';
            const borrowAPY = asset.realTimeRates?.borrowAPY || asset.apy || '0%';
            // const utilizationRate = asset.realTimeRates?.utilizationRate || asset.utilizationRate || '0%';
            
            return (
              <div
                key={asset.assetAddress || i}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_auto] gap-3 py-3 items-center border-t border-[#3A3A3A] first:border-t-0 hover:bg-[#363636] transition-colors"
              >
                {/* Asset */}
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={asset.asset} />
                  <div>
                    <span className="text-[#E0E0E0] font-medium">{asset.asset}</span>
                    {/* <p className="text-[#A0A0A0] text-xs">{asset.availableAmount}</p> */}
                  </div>
                </div>

                {/* Liquidity */}
                <div>
                  <p className="text-[#E0E0E0] text-sm font-medium">{liquidity.formatted}</p>
                  {/* <p className="text-[#A0A0A0] text-xs">{liquidity.amount}</p> */}
                </div>

                {/* Utilization Rate */}
                {/* <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#3A3A3A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F06718] rounded-full transition-all"
                        style={{ width: utilizationRate }}
                      />
                    </div>
                    <span className="text-[#E0E0E0] text-xs font-medium min-w-[40px]">{utilizationRate}</span>
                  </div>
                </div> */}

                {/* LTV / Liquidation Threshold */}
                <div className="text-center">
                  <span className="text-[#E0E0E0] text-sm">
                    {asset.collateralFactor}% / {asset.liquidationThreshold}%
                  </span>
                </div>

                {/* Supply APY */}
                <div className="text-center">
                  <span className="text-green-400 text-sm font-medium">{supplyAPY}</span>
                </div>

                {/* Borrow APY */}
                <div className="text-center">
                  <span className="text-[#F06718] text-sm font-medium">{borrowAPY}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setBorrowOpen(true);
                    }}
                    disabled={!asset.canBorrow}
                    className="px-3 py-1.5 bg-[#F06718] hover:bg-[#D85A14] text-white text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setDetailsOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#E0E0E0] text-xs rounded-md transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
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
