import { useMemo, useState } from 'react';
import type { AvailableToBorrow, InterestRateParams } from '../types/lending.types';
import BorrowModal from './borrowModal';
import BorrowDetailsModal from './borrowDetailsModal';
import { TokenIcon } from './tokenIcon';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
import { logger } from '@/utils/prodLogger';

// Create contextual logger for AvailableToBorrowTable component
const log = logger.withContext({ component: 'AvailableToBorrowTable' });

export default function AvailableToBorrowTable({
  data,
  chainId,
  interestRateParams,
}: {
  data: AvailableToBorrow[];
  chainId: number;
  interestRateParams?: InterestRateParams[];
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
        <h2 className="text-white font-medium">Assets to borrow</h2>
      </div>

      <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-gray-400 text-xs">
        <span>Asset</span>
        <span>Liquidity</span>
        <span>APY</span>
        <span></span>
      </div>

      <div className="px-4 pb-4 max-h-80 overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No assets available to borrow</p>
        ) : (
          data.map((asset, i) => (
            <div
              key={asset.assetAddress || i}
              className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 py-3 items-center border-t border-[#3A3A3A] first:border-t-0"
            >
              <div className="flex items-center gap-2">
                <TokenIcon symbol={`gs${asset.asset}`} />
                <span className="text-white font-medium">{asset.asset}</span>
              </div>
              <div>
                <p className="text-white text-sm">
                  {asset.availableLiquidity ?
                    parseFloat(asset.availableLiquidity.replace(/,/g, '')).toLocaleString() :
                    '0'
                  }
                </p>
                <p className="text-gray-400 text-xs">{asset.asset}</p>
              </div>
              <span className="text-white text-sm">{asset.apy}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBorrowOpen(true)}
                  disabled={!asset.canBorrow}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Borrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setDetailsOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BorrowModal
        isOpen={borrowOpen}
        onClose={() => setBorrowOpen(false)}
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
