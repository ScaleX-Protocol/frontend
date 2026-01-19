'use client';

import { TrendingUp } from 'lucide-react';
import type { LendingSupply } from '@/features/lending/types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';
import TableStateWrapper from './TableStateWrapper';

interface EarnTableProps {
  data: LendingSupply[];
  isLoading: boolean;
  error: Error | null;
  onAddAssets?: () => void;
}

const COLUMNS = [
  { label: 'ASSET', align: 'left' as const },
  { label: 'BALANCE', align: 'center' as const },
  { label: 'APY', align: 'right' as const },
];

export default function EarnTable({ data, isLoading, error, onAddAssets }: EarnTableProps) {
  return (
    <TableStateWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={data.length === 0}
      columns={COLUMNS}
      loadingText="Loading earning assets..."
      emptyConfig={{
        icon: <TrendingUp className="w-6 h-6 text-[#444444]" />,
        title: 'Ready to Earn?',
        description: 'Your idle assets could be growing.',
        buttonText: 'Add Assets',
        onAction: onAddAssets,
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
              <span className="text-[#E0E0E0] font-dm-sans">{asset.asset}</span>
            </div>
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-center">
            {asset.suppliedAmount} {asset.asset}
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-right">
            {asset.apy}
          </div>
        </div>
      ))}
    </TableStateWrapper>
  );
}
