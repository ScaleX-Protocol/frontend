'use client';

import type { LendingSummary } from '@/features/lending/types/lending.types';
import { BarChart3 } from 'lucide-react';

interface MarketOverviewCardProps {
    data?: LendingSummary;
    loading?: boolean;
}

export default function MarketOverviewCard({ data, loading = false }: MarketOverviewCardProps) {
    const summary = data || {
        totalSupplied: '0',
        totalBorrowed: '0',
        netAPY: '0',
        healthFactor: '999999',
    };

    const isInfinity = (hf: string) => {
        const num = parseFloat(hf);
        return num > 999;
    };

    return (
        <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#1A1A1A]">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-[#606060]" />
                <span className="text-[#E0E0E0] font-medium">Market Overview</span>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-[#606060] text-sm">Net APY</span>
                    <span className="text-[#22C55E] text-sm font-medium">
                        {loading ? '...' : `↗ ${parseFloat(summary.netAPY).toFixed(2)}%`}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-[#606060] text-sm">Health Factor</span>
                    <span className="text-[#22C55E] text-sm font-medium">
                        {loading ? '...' : isInfinity(summary.healthFactor) ? '∞' : parseFloat(summary.healthFactor).toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-[#606060] text-sm">Total Supplied</span>
                    <span className="text-[#E0E0E0] text-sm font-medium">
                        ${loading ? '...' : parseFloat(summary.totalSupplied).toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-[#606060] text-sm">Total Borrowed</span>
                    <span className="text-[#E0E0E0] text-sm font-medium">
                        ${loading ? '...' : parseFloat(summary.totalBorrowed).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
