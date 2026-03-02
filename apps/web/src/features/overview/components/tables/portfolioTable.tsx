'use client';

import { Wallet } from 'lucide-react';
import type { LendingSupply } from '@scalex/types';
import { TokenIcon } from '@/components/common/TokenIcon';
import TableStateWrapper from './TableStateWrapper';

interface PortfolioTableProps {
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

export default function PortfolioTable({ data, isLoading, error, onAddAssets }: PortfolioTableProps) {
  // Debug data
  console.log('📊 PortfolioTable Debug:', {
    dataLength: data?.length,
    data,
    isLoading,
    error: error?.message,
    isEmpty: data.length === 0,
  });

  return (
    <TableStateWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={data.length === 0}
      columns={COLUMNS}
      loadingText="Loading portfolio assets..."
      emptyConfig={{
        icon: <Wallet className="w-6 h-6 text-[#444444]" />,
        title: 'Start Your Portfolio',
        description: 'Deposit assets to begin managing your wealth.',
        buttonText: 'Add Assets',
        onAction: onAddAssets,
      }}
    >
      {data.map((asset) => (
        <div
          key={asset.id}
          className="flex flex-row items-center hover:bg-[#141414] transition-colors"
        >
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <TokenIcon symbol={`gs${asset.asset}`} />
              <span className="text-[#E0E0E0] text-sm">{asset.asset}</span>
            </div>
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-center">
            {asset.suppliedAmount} {asset.asset}
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-right">
            {asset.apy}
          </div>
        </div>
      ))}
    </TableStateWrapper>
  );
}
