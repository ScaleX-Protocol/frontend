import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import LeaderboardRow from './LeaderboardRow';
import TableStateWrapper from '@/features/overview/components/tables/TableStateWrapper';
import type { LeaderboardEntry, LeaderboardSortBy, LeaderboardType, LeaderboardWindow } from '../types/leaderboard.types';

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
        { label: 'Trader', align: 'left' as const },
        ...(!activeType ? [{ label: 'Type', align: 'left' as const }] : []),
        { label: 'PnL', align: 'right' as const },
        { label: 'Volume', align: 'right' as const },
        ...(activeType === 'agent' ? [{ label: 'Managed Users', align: 'right' as const }] : []),
        { label: 'Win Rate', align: 'right' as const },
        { label: 'Fill Rate', align: 'right' as const },
        { label: 'Trades', align: 'right' as const },
    ];

    const pillBase = 'px-3 py-1 rounded-md text-xs font-medium transition-colors';
    const pillActive = 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20';
    const pillInactive = 'bg-[#1A1A1A] text-[#808080] hover:text-[#E0E0E0]';

    return (
        <div className="flex-1 p-4 md:p-6">
            {/* Header + Filters */}
            <div className="mb-4 flex flex-col gap-3">
                <h1 className="text-lg font-semibold text-[#FFFFFF]">Leaderboard</h1>

                {/* Type tabs */}
                <div className="flex items-center gap-2">
                    {([undefined, 'user', 'agent'] as const).map((t) => (
                        <button
                            key={t ?? 'all'}
                            type="button"
                            onClick={() => handleTypeChange(t)}
                            className={`${pillBase} ${activeType === t ? pillActive : pillInactive}`}
                        >
                            {t === undefined ? 'All' : t === 'user' ? 'Users' : 'Agents'}
                        </button>
                    ))}
                </div>

                {/* Sort + Window row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        {SORT_OPTIONS
                            .filter(o => o.key !== 'managed_users' || activeType === 'agent')
                            .map(o => (
                                <button
                                    key={o.key}
                                    type="button"
                                    onClick={() => handleSortChange(o.key)}
                                    className={`${pillBase} ${sortBy === o.key ? pillActive : pillInactive}`}
                                >
                                    {o.label}
                                </button>
                            ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {WINDOWS.map(w => (
                            <button
                                key={w.key}
                                type="button"
                                onClick={() => handleWindowChange(w.key)}
                                className={`${pillBase} ${activeWindow === w.key ? pillActive : pillInactive}`}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
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

                {/* Load More */}
                {hasMore && !error && (
                    <div className="flex justify-center p-4 border-t border-[#1F1F1F]">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => setOffset(prev => prev + LIMIT)}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-[#1A1A1A] text-[#808080] hover:text-[#E0E0E0] disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
