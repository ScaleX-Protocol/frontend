import { createColumnHelper, type ColumnDef, type CellContext } from '@tanstack/react-table';
import type { Balance } from '@/features/trade/types/history.types';
import { TokenIcon } from '@/components/common/TokenIcon';
import { formaterAsset } from '@/features/trade/utils/history.helper';

const columnHelper = createColumnHelper<Balance>();

export const getBalancesColumns = () => {
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
        const decimals = info.row.original.asset === 'USDC' || info.row.original.asset === 'sxUSDC' ? 6 : 18;
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
        const decimals = info.row.original.asset === 'USDC' || info.row.original.asset === 'sxUSDC' ? 6 : 18;
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
