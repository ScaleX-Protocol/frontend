'use client';

import type { LendingSummary } from '@/features/lending/types/lending.types';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

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
        <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F]">
            <div className="flex items-center p-4 gap-2 border-b border-[#1F1F1F]">
                <BarChart3 size={16} className="text-[#E26B1D]" />
                <span className="text-[#FFFFFF] font-semibold text-sm leading-[20px]">Market Overview</span>
            </div>

            <div className="flex flex-col p-2">
                <div className="flex justify-between items-center p-3 border-b border-[#161616]">
                    <span className="text-[#888888] text-xs font-medium leading-[16px]">Net APY</span>
                    <span className={`text-sm font-medium leading-[20px] flex items-center gap-1 ${parseFloat(summary.netAPY) >= 0 ? 'text-[#2ECC71]' : 'text-[#EF4444]'}`}>
                        {loading ? '...' : (
                            <>
                                {parseFloat(summary.netAPY) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {parseFloat(summary.netAPY).toFixed(2)}%
                            </>
                        )}
                    </span>
                </div>

                <div className="flex justify-between items-center p-3 border-b border-[#161616]">
                    <span className="text-[#888888] text-xs font-medium leading-[16px]">Health Factor</span>
                    <span className="text-[#22C55E] text-sm font-medium leading-[20px]">
                        {loading ? '...' : isInfinity(summary.healthFactor) ? '∞' : parseFloat(summary.healthFactor).toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between items-center p-3 border-b border-[#161616]">
                    <span className="text-[#888888] text-xs font-medium leading-[16px]">Total Supplied</span>
                    <span className="text-[#FFFFFF] text-sm font-medium leading-[20px]">
                        ${loading ? '...' : parseFloat(summary.totalSupplied).toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between items-center p-3">
                    <span className="text-[#888888] text-xs font-medium leading-[16px]">Total Borrowed</span>
                    <span className="text-[#FFFFFF] text-sm font-medium leading-[20px]">
                        ${loading ? '...' : parseFloat(summary.totalBorrowed).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
