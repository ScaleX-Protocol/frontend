import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import LeaderboardRow from './LeaderboardRow';
import TableStateWrapper from '@/features/overview/components/tables/TableStateWrapper';
import type { LeaderboardEntry, LeaderboardSortBy, LeaderboardType, LeaderboardWindow } from '../types/leaderboard.types';
import { useIsMobile } from '@/hooks/ui/useViewMode';

const LIMIT = 10;
const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'All Time' },
];
const SORT_OPTIONS: { key: LeaderboardSortBy; label: string }[] = [
    { key: 'pnl', label: 'PnL' },
    { key: 'volume', label: 'Volume' },
    { key: 'managed_users', label: 'Managed Users' },
];

export default function LeaderboardTable() {
    const isMobile = useIsMobile();
    const [activeType, setActiveType] = useState<LeaderboardType | undefined>(undefined);
    const [sortBy, setSortBy] = useState<LeaderboardSortBy>('volume');
    const [activeWindow, setActiveWindow] = useState<LeaderboardWindow>('7d');
    const [offset, setOffset] = useState(0);
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);

    const { data, isLoading, error } = useLeaderboard({
        type: activeType,
        sortBy,
        window: activeWindow,
        limit: LIMIT,
        offset,
    });

    useEffect(() => {
        if (!data?.data) return;
        if (offset === 0) {
            setAllEntries(data.data);
        } else {
            setAllEntries(prev => [...prev, ...data.data]);
        }
    }, [data, offset]);

    const handleTypeChange = (type: LeaderboardType | undefined) => {
        if (type !== 'agent' && sortBy === 'managed_users') setSortBy('volume');
        setActiveType(type);
        setOffset(0);
        setAllEntries([]);
    };

    const handleSortChange = (sort: LeaderboardSortBy) => {
        setSortBy(sort);
        setOffset(0);
        setAllEntries([]);
    };

    const handleWindowChange = (w: LeaderboardWindow) => {
        setActiveWindow(w);
        setOffset(0);
        setAllEntries([]);
    };

    const totalCount = data?.count ?? 0;
    const hasMore = allEntries.length > 0 && allEntries.length < totalCount;

    const columns = [
        { label: 'Rank', align: 'left' as const },
        { label: 'Trader', align: 'left' as const, className: 'flex-[1.5]' },
        ...(!activeType ? [{ label: 'Type', align: 'left' as const }] : []),
        { label: 'PnL', align: 'right' as const, className: 'w-[100px]' },
        { label: 'Volume', align: 'right' as const, className: 'flex-[1.5]' },
        ...(activeType === 'agent' ? [{ label: 'Managed', align: 'right' as const }] : []),
        { label: 'Win Rate', align: 'right' as const },
        { label: 'Fill Rate', align: 'right' as const },
        { label: 'Trades', align: 'right' as const },
    ];

    const containerClass = isMobile
        ? "w-full flex-1 flex flex-col gap-6 p-5 pb-[72px] overflow-x-hidden"
        : "w-full flex-1 p-8 flex flex-col gap-6";

    return (
        <div className={containerClass}>
            {/* Header + Filters */}
            <div className="flex flex-col gap-5">
                <h1 className="text-xl font-bold text-[#FFFFFF]">Leaderboard</h1>

                {/* Type tabs (User Friendly) */}
                <div className="flex flex-row gap-4 border-b border-[#2A2A2A] overflow-x-auto no-scrollbar">
                    {([undefined, 'user', 'agent'] as const).map((t) => {
                        const isActive = activeType === t;
                        return (
                            <button
                                key={t ?? 'all'}
                                type="button"
                                onClick={() => handleTypeChange(t)}
                                className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative whitespace-nowrap ${isActive ? 'text-white' : 'text-[#666666] hover:text-[#E0E0E0]'
                                    }`}
                            >
                                {t === undefined ? 'All' : t === 'user' ? 'Users' : 'Agents'}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Sort Options */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                        <span className="text-xs text-[#606060] hidden md:inline-block mr-1">Sort:</span>
                        {SORT_OPTIONS
                            .filter(o => o.key !== 'managed_users' || activeType === 'agent')
                            .map(o => (
                                <button
                                    key={o.key}
                                    type="button"
                                    onClick={() => handleSortChange(o.key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${sortBy === o.key
                                        ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                                        : 'bg-[#111111] border border-[#1F1F1F] text-[#808080] hover:text-[#E0E0E0] hover:bg-[#1A1A1A]'
                                        }`}
                                >
                                    {o.label}
                                </button>
                            ))}
                    </div>

                    {/* Window Options */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                        <span className="text-xs text-[#606060] hidden md:inline-block mr-1">Time:</span>
                        {WINDOWS.map(w => (
                            <button
                                key={w.key}
                                type="button"
                                onClick={() => handleWindowChange(w.key)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeWindow === w.key
                                    ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                                    : 'bg-[#111111] border border-[#1F1F1F] text-[#808080] hover:text-[#E0E0E0] hover:bg-[#1A1A1A]'
                                    }`}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col flex-1">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full no-scrollbar">
                    <div className="min-w-[1024px]">
                        <TableStateWrapper
                            isLoading={isLoading && offset === 0}
                            error={error}
                            isEmpty={allEntries.length === 0 && !isLoading}
                            columns={columns}
                            emptyConfig={{
                                icon: <Trophy size={24} className="text-[#606060]" />,
                                title: 'No leaderboard data yet',
                                description: 'Rankings will appear once trades have been recorded.',
                            }}
                            loadingText="Loading rankings..."
                        >
                            {allEntries.map(entry => (
                                <LeaderboardRow
                                    key={`${entry.type}-${entry.rank}-${offset}`}
                                    entry={entry}
                                    activeType={activeType}
                                />
                            ))}
                        </TableStateWrapper>
                    </div>
                </div>

                {/* Load More */}
                {hasMore && !error && (
                    <div className="flex justify-center p-4 border-t border-[#1F1F1F] bg-[#0A0A0A]">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => setOffset(prev => prev + LIMIT)}
                            className="px-6 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-[#808080] border border-[#2A2A2A] hover:text-[#E0E0E0] hover:bg-[#222222] disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
