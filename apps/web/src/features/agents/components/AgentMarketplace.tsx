import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Bot, ArrowUpDown } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import AgentCard from './AgentCard';

type SortKey = 'volume' | 'users' | 'activity';

export default function AgentMarketplace() {
  const { data, isLoading, error } = useAgents();
  const [sortBy, setSortBy] = useState<SortKey>('volume');

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

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#FFFFFF]">Agent Marketplace</h1>
          <p className="text-sm text-[#606060] mt-1">
            Discover and authorize AI trading agents to manage your portfolio
          </p>
        </div>
        <Link
          to="/agents/my"
          className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-sm text-[#E0E0E0] hover:bg-[#222222] transition-colors"
        >
          My Agents
        </Link>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown size={14} className="text-[#606060]" />
        <span className="text-xs text-[#606060]">Sort by:</span>
        {(['volume', 'users', 'activity'] as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === key
                ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                : 'bg-[#1A1A1A] text-[#808080] hover:text-[#E0E0E0]'
            }`}
          >
            {key === 'volume' ? 'Volume' : key === 'users' ? 'Users' : 'Recent'}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        <div className="text-center py-12">
          <p className="text-[#808080]">Failed to load agents. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="text-center py-16">
          <Bot size={48} className="mx-auto text-[#333333] mb-4" />
          <h3 className="text-[#FFFFFF] font-semibold mb-2">No agents registered yet</h3>
          <p className="text-[#606060] text-sm">
            AI trading agents will appear here once they are registered on-chain.
          </p>
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && !error && agents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.agentTokenId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
