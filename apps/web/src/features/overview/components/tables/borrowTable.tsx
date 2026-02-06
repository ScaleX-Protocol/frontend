'use client';

import { ArrowDownLeft } from 'lucide-react';
import type { LendingBorrow } from '@/features/lending/types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';
import TableStateWrapper from './TableStateWrapper';

interface BorrowTableProps {
  data: LendingBorrow[];
  isLoading: boolean;
  error: Error | null;
  onBorrowNow?: () => void;
}

const COLUMNS = [
  { label: 'ASSET', align: 'left' as const },
  { label: 'AMOUNT', align: 'center' as const },
  { label: 'APY', align: 'right' as const },
];

export default function BorrowTable({ data, isLoading, error, onBorrowNow }: BorrowTableProps) {
  return (
    <TableStateWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={data.length === 0}
      columns={COLUMNS}
      loadingText="Loading borrow assets..."
      emptyConfig={{
        icon: <ArrowDownLeft className="w-6 h-6 text-[#444444]" />,
        title: 'Unlock Instant Liquidity',
        description: 'Access capital without selling your crypto.',
        buttonText: 'Borrow Now',
        onAction: onBorrowNow,
      }}
    >
      {data.map((asset) => (
        <div
          key={asset.id}
          className="flex flex-row items-center hover:bg-[#2A2A2A] transition-colors"
        >
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <TokenIcon symbol={asset.asset} />
              <span className="text-[#E0E0E0] text-sm">{asset.asset}</span>
            </div>
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-center">
            {asset.borrowedAmount} {asset.asset}
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-right">
            {asset.apy}
          </div>
        </div>
      ))}
    </TableStateWrapper>
  );
}
