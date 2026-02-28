import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Bot, ArrowUpDown } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import AgentCard from './AgentCard';
import { useIsMobile } from '@/hooks/ui/useViewMode';

type SortKey = 'volume' | 'users' | 'activity';

export default function AgentMarketplace() {
  const { data, isLoading, error } = useAgents();
  const [sortBy, setSortBy] = useState<SortKey>('volume');
  const isMobile = useIsMobile();

  const agents = useMemo(() => {
    const list = data?.data || [];
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return Number(BigInt((b.totalVolume || b.totalTradingVolume || '0').split('.')[0] || '0') - BigInt((a.totalVolume || a.totalTradingVolume || '0').split('.')[0] || '0'));
        case 'users':
          return (b.activeUsers || 0) - (a.activeUsers || 0);
        case 'activity':
          return (b.lastActivityAt || 0) - (a.lastActivityAt || 0);
        default:
          return 0;
      }
    });
  }, [data?.data, sortBy]);

  const containerClass = isMobile
    ? "w-full flex-1 flex flex-col gap-6 p-5 pb-[24px]"
    : "w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-6 flex flex-col gap-6";

  const gridClass = isMobile
    ? "flex flex-col gap-4"
    : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FFFFFF]">Agent Marketplace</h1>
          <p className="text-sm text-[#606060] mt-1">
            Discover and authorize AI trading agents to manage your portfolio
          </p>
        </div>
        {!isMobile && (
          <Link
            to="/agents/my"
            className="px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-sm font-medium text-[#E0E0E0] hover:bg-[#333333] transition-colors"
          >
            My Agents
          </Link>
        )}
      </div>

      {isMobile && (
        <Link
          to="/agents/my"
          className="w-full max-w-[200px] text-center px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] hover:bg-[#222222] transition-colors"
        >
          My Agents
        </Link>
      )}

      {/* Sort Controls - User Friendly Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#808080] text-sm">
          <ArrowUpDown size={14} />
          <span>Sort by</span>
        </div>
        <div className="flex flex-row gap-4 border-b border-[#2A2A2A]">
          {(['volume', 'users', 'activity'] as SortKey[]).map((key) => {
            const isActive = sortBy === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative ${isActive ? 'text-white' : 'text-[#666666]'
                  }`}
              >
                {key === 'volume' ? 'Volume' : key === 'users' ? 'Users' : 'Recent'}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A]" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
                  <div className="h-3 w-32 bg-[#1A1A1A] rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-[#0A0A0A] rounded-lg" />
                <div className="h-16 bg-[#0A0A0A] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="w-full bg-[#1A1A1A] flex-1 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[200px] border border-[#2A2A2A]">
          <p className="text-[#808080]">Failed to load agents. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="w-full bg-[#111111] flex-1 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] border border-[#2A2A2A]">
          <Bot size={48} className="mx-auto text-[#333333] mb-4" />
          <h3 className="text-[#FFFFFF] font-semibold mb-2 text-lg">No agents registered yet</h3>
          <p className="text-[#606060] text-sm text-center max-w-sm">
            AI trading agents will appear here once they are registered on-chain.
          </p>
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && !error && agents.length > 0 && (
        <div className={gridClass}>
          {agents.map((agent) => (
            <AgentCard key={agent.agentTokenId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
