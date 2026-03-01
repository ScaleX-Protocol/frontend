import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, TrendingUp, Clock, Bot, Activity } from 'lucide-react';
import type { AgentMarketplaceItem } from '../types/agents.types';
import { formatTokenAmount, formatRelativeTime } from '../utils/formatPolicy';
import { useAgentMetadata } from '../hooks/useAgentMetadata';

interface AgentCardProps {
  agent: AgentMarketplaceItem;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const totalOrders = agent.totalOrders ?? ((agent.totalMarketOrders || 0) + (agent.totalLimitOrders || 0));
  const { data: metadata, isLoading: loadingMetadata } = useAgentMetadata(agent.agentTokenId);
  const [imgError, setImgError] = useState(false);

  const agentName = metadata?.name || `Agent #${agent.agentTokenId}`;
  const riskAttr = metadata?.attributes?.find(a => a.trait_type === 'Risk Level');

  return (
    <Link
      to="/agents/$agentTokenId"
      params={{ agentTokenId: agent.agentTokenId }}
      className="group block bg-[#111111] border border-[#222222] rounded-xl overflow-hidden hover:border-[#333333] hover:bg-[#161616] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300"
    >
      {/* Agent Image — dominant */}
      <div className="relative aspect-square w-full bg-[#0A0A0A] overflow-hidden border-b border-[#1F1F1F]">
        {metadata?.image && !imgError ? (
          <img
            src={metadata.image}
            alt={agentName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${loadingMetadata ? 'animate-pulse' : ''}`}>
            {!loadingMetadata && (
              <Bot className="text-[#F06718]/30 w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-500" />
            )}
          </div>
        )}

        {riskAttr && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider ${riskAttr.value === 'High' ? 'text-[#EF4444]' :
              riskAttr.value === 'Medium' ? 'text-yellow-400' :
                'text-[#2ECC71]'
              }`}>
              {riskAttr.value} Risk
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          {loadingMetadata ? (
            <div className="h-4 w-28 bg-[#1A1A1A] rounded animate-pulse" />
          ) : (
            <h3 className="text-[#FFFFFF] font-semibold text-sm">{agentName}</h3>
          )}
        </div>
        {metadata?.description && (
          <p className="text-[#808080] text-xs mb-3 line-clamp-2">{metadata.description}</p>
        )}

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <Users size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Users</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">{agent.totalUsers}</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <TrendingUp size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Vol</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">
              {formatTokenAmount(agent.totalVolume || agent.totalTradingVolume || '0')}
            </p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <Activity size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Orders</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">{totalOrders}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[#606060] text-xs">
          <Clock size={12} />
          <span>Last active: {formatRelativeTime(agent.lastActivityAt || 0)}</span>
        </div>
      </div>
    </Link>
  );
}
