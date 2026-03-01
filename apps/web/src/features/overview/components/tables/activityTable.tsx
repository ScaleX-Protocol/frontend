'use client';

import { Activity } from 'lucide-react';
import type { ActivityHistory } from '@/features/lending/types/lending.types';
import TableStateWrapper from './TableStateWrapper';
import { getBlockExplorerTxUrl } from '@/configs/chain';

interface ActivityTableProps {
  data: ActivityHistory[];
  isLoading: boolean;
  error: Error | null;
}

const COLUMNS = [
  { label: 'ACTION', align: 'left' as const },
  { label: 'ASSET', align: 'left' as const },
  { label: 'AMOUNT', align: 'center' as const },
  { label: 'DATE', align: 'center' as const },
  { label: 'TX', align: 'right' as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time}`;
}

type ActionConfig = {
  label: string;
  className: string;
};

const ACTION_CONFIG: Record<ActivityHistory['action'], ActionConfig> = {
  SUPPLY:  { label: 'Supply',   className: 'bg-[#2ECC71]/10 text-[#2ECC71]' },
  REPAY:   { label: 'Repay',    className: 'bg-[#2ECC71]/10 text-[#2ECC71]' },
  WITHDRAW:{ label: 'Withdraw', className: 'bg-[#E74C3C]/10 text-[#E74C3C]' },
  BORROW:  { label: 'Borrow',   className: 'bg-[#E74C3C]/10 text-[#E74C3C]' },
};

function ActionBadge({ action }: { action: ActivityHistory['action'] }) {
  const cfg: ActionConfig = ACTION_CONFIG[action] ?? {
    label: action,
    className: 'bg-[#F39C12]/10 text-[#F39C12]',
  };
  return (
    <span className={`px-2 py-0.5 rounded-[6px] text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export default function ActivityTable({ data, isLoading, error }: ActivityTableProps) {
  return (
    <TableStateWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={data.length === 0}
      columns={COLUMNS}
      loadingText="Loading activity..."
      emptyConfig={{
        icon: <Activity className="w-6 h-6 text-[#444444]" />,
        title: 'No activity yet',
        description: 'Your deposit, borrow, and repay history will appear here.',
      }}
    >
      {data.map((item, i) => (
        <div
          key={`${item.transactionId}-${i}`}
          className="flex flex-row items-center hover:bg-[#141414] transition-colors"
        >
          <div className="flex-1 px-4 py-3">
            <ActionBadge action={item.action} />
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm">
            {item.token}
          </div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-center">
            {item.amount}
          </div>
          <div className="flex-1 px-4 py-3 text-[#A0A0A0] text-sm text-center">
            {formatDate(item.createdAt)}
          </div>
          <div className="flex-1 px-4 py-3 text-right">
            <a
              href={getBlockExplorerTxUrl(item.transactionId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F06718] hover:text-[#F5955D] text-xs font-mono transition-colors"
            >
              {item.transactionId.slice(0, 8)}…
            </a>
          </div>
        </div>
      ))}
    </TableStateWrapper>
  );
}
