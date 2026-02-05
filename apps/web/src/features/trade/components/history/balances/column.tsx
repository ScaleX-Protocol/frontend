import { createColumnHelper, type ColumnDef, type CellContext } from '@tanstack/react-table';
import type { Balance } from '@/features/trade/types/history.types';
import { TokenIcon } from '@/components/common/TokenIcon';
import { formaterAsset } from '@/features/trade/utils/history.helper';
import type { Currency } from '@scalex/types';

const columnHelper = createColumnHelper<Balance>();

/**
 * Get the correct decimal places for an asset from currencies data
 * Falls back to sensible defaults if not found
 */
const getAssetDecimals = (asset: string, currencies: Currency[]): number => {
  // First, try to find the asset in currencies data from API
  const currency = currencies.find(
    (c) => c.symbol.toUpperCase() === asset.toUpperCase()
  );
  
  if (currency) {
    return currency.decimals;
  }
  
  // Fallback to defaults if not found in API data
  const upperAsset = asset.toUpperCase();
  
  // IDR-based tokens use 0 decimals
  if (upperAsset === 'SXIDRX' || upperAsset === 'IDRX' || upperAsset === 'IDR') {
    return 0;
  }
  
  // USDC-based tokens use 6 decimals
  if (upperAsset === 'USDC' || upperAsset === 'SXUSDC') {
    return 6;
  }
  
  // Default to 18 decimals (ETH standard)
  return 18;
};

export const getBalancesColumns = (currencies: Currency[] = []) => {
  return [
    columnHelper.accessor('asset', {
      id: 'asset',
      header: () => 'Asset',
      cell: (info: CellContext<Balance, string>) => {
        const balance = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <TokenIcon symbol={balance.asset} />
            <div>
              <div className="text-sm font-medium text-[#E0E0E0]">{info.getValue()}</div>
            </div>
          </div>
        );
      },
      meta: { align: 'left' },
    }),
    columnHelper.accessor('locked', {
      header: () => <div className="text-right">Locked</div>,
      cell: (info) => {
        const hasLockedBalance = info.getValue() > 0;
        const decimals = getAssetDecimals(info.row.original.asset, currencies);
        const lockedValue = formaterAsset(info.getValue(), decimals);
        return (
          <div className={`text-right font-mono ${hasLockedBalance ? 'text-yellow-400' : 'text-gray-500'}`}>
            {lockedValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
        );
      },
      meta: { align: 'right' },
    }),
    columnHelper.accessor('free', {
      header: () => <div className="text-right">Free</div>,
      cell: (info) => {
        const decimals = getAssetDecimals(info.row.original.asset, currencies);
        const freeValue = formaterAsset(info.getValue(), decimals);

        return (
          <div className="text-right text-[#E0E0E0] font-mono font-semibold">
            {freeValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
        );
      },
      meta: { align: 'right' },
    }),
  ] as ColumnDef<Balance>[];
};

