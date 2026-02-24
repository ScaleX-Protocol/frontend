import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardType } from '../types/leaderboard.types';

function truncateAddress(addr: string): string {
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function formatAmount(val: string): string {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDRX`;
}

function formatPercent(val: number): string {
    return `${(val * 100).toFixed(1)}%`;
}

function pnlColor(val: string): string {
    const n = parseFloat(val);
    if (n > 0) return 'text-green-400';
    if (n < 0) return 'text-red-400';
    return 'text-[#606060]';
}

function pnlPrefix(val: string): string {
    const n = parseFloat(val);
    return n > 0 ? '+' : '';
}

interface Props {
    entry: LeaderboardEntry;
    activeType?: LeaderboardType;
}

export default function LeaderboardRow({ entry, activeType }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const isAgent = entry.type === 'agent';
    const isUser = entry.type === 'user';
    const showManagedUsers = activeType === 'agent';

    return (
        <div className="flex flex-row items-center px-6 py-3 border-b border-[#0A0A0A] hover:bg-[#161616] transition-colors">
            {/* Rank */}
            <div className="flex-1 text-[#606060] text-sm font-mono">
                #{entry.rank}
            </div>

            {/* Entity */}
            <div className="flex-1">
                {isUser && (
                    <button
                        type="button"
                        onClick={(e) => handleCopy(entry.address, e)}
                        className="flex items-center gap-1.5 group"
                        aria-label={`Copy address ${entry.address}`}
                        title={copied ? 'Copied!' : 'Click to copy address'}
                    >
                        <span className="text-sm text-[#E0E0E0] font-mono group-hover:text-[#F06718] transition-colors">
                            {truncateAddress(entry.address)}
                        </span>
                        {copied
                            ? <Check size={12} className="text-green-400" />
                            : <Copy size={12} className="text-[#606060] group-hover:text-[#F06718]" />
                        }
                    </button>
                )}
                {isAgent && (
                    <Link
                        to="/agents/$agentTokenId"
                        params={{ agentTokenId: entry.agentTokenId }}
                        className="flex items-center gap-1.5 group"
                    >
                        <span className="text-sm text-[#E0E0E0] group-hover:text-[#F06718] transition-colors">
                            Agent #{entry.agentTokenId}
                        </span>
                        <ExternalLink size={12} className="text-[#606060] group-hover:text-[#F06718]" />
                    </Link>
                )}
            </div>

            {/* Type badge — only in All view */}
            {!activeType && (
                <div className="flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isAgent
                            ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                            : 'bg-[#1A1A1A] text-[#808080]'
                    }`}>
                        {entry.type}
                    </span>
                </div>
            )}

            {/* PnL */}
            <div className={`flex-1 text-sm font-mono text-right ${pnlColor(entry.realizedPnl)}`}>
                {pnlPrefix(entry.realizedPnl)}{formatAmount(entry.realizedPnl)}
            </div>

            {/* Volume */}
            <div className="flex-1 text-sm font-mono text-right text-[#E0E0E0]">
                {formatAmount(entry.totalVolume)}
            </div>

            {/* Managed Users — agent view only */}
            {showManagedUsers && (
                <div className="flex-1 text-sm text-right text-[#E0E0E0]">
                    {isAgent ? entry.managedUsers : '—'}
                </div>
            )}

            {/* Win Rate */}
            <div className="flex-1 text-sm text-right text-[#E0E0E0]">
                {formatPercent(entry.winRate)}
            </div>

            {/* Fill Rate */}
            <div className="flex-1 text-sm text-right text-[#E0E0E0]">
                {formatPercent(entry.fillRate)}
            </div>

            {/* Trades */}
            <div className="flex-1 text-sm text-right text-[#606060]">
                {entry.totalTrades}
            </div>
        </div>
    );
}
