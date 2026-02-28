import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, TrendingUp, Clock, Bot } from 'lucide-react';
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
      className="flex flex-col sm:flex-row bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden hover:border-[#333333] hover:bg-[#161616] transition-all duration-200 p-4 gap-4"
    >
      {/* Container for Image & Name/Mobile Name layout */}
      <div className="flex flex-row items-center sm:items-start sm:flex-col shrink-0 gap-4 sm:w-[100px]">
        {/* Standardized Fast Image */}
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#0A0A0A] overflow-hidden shrink-0 border border-[#1F1F1F]">
          {metadata?.image && !imgError ? (
            <img
              src={metadata.image}
              alt={agentName}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${loadingMetadata ? 'animate-pulse' : ''
              }`}>
              {!loadingMetadata && (
                <Bot className="text-[#F06718]/30 w-8 h-8 sm:w-12 sm:h-12" />
              )}
            </div>
          )}
        </div>

        {/* Name on Mobile (beside image) */}
        <div className="flex-1 sm:hidden">
          {loadingMetadata ? (
            <div className="h-4 w-28 bg-[#1A1A1A] rounded animate-pulse mb-1" />
          ) : (
            <h3 className="text-[#FFFFFF] font-semibold text-sm line-clamp-1">{agentName}</h3>
          )}
          {riskAttr && (
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${riskAttr.value === 'High' ? 'bg-red-500/10 text-[#EF4444]' :
                riskAttr.value === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-[#2ECC71]/10 text-[#2ECC71]'
              }`}>
              {riskAttr.value}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {/* Description & Name on Desktop */}
        <div className="mb-3">
          <div className="hidden sm:flex items-center justify-between mb-1.5 gap-2">
            {loadingMetadata ? (
              <div className="h-5 w-32 bg-[#1A1A1A] rounded animate-pulse" />
            ) : (
              <h3 className="text-[#FFFFFF] font-semibold text-base line-clamp-1">{agentName}</h3>
            )}

            {riskAttr && (
              <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${riskAttr.value === 'High' ? 'bg-red-500/10 text-[#EF4444]' :
                  riskAttr.value === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-[#2ECC71]/10 text-[#2ECC71]'
                }`}>
                {riskAttr.value} RISK
              </span>
            )}
          </div>

          {metadata?.description ? (
            <p className="text-[#808080] text-xs line-clamp-2 leading-relaxed">{metadata.description}</p>
          ) : !loadingMetadata ? (
            <p className="text-[#606060] text-xs italic">No description provided</p>
          ) : (
            <div className="space-y-1">
              <div className="h-3 bg-[#1A1A1A] rounded w-full animate-pulse" />
              <div className="h-3 bg-[#1A1A1A] rounded w-2/3 animate-pulse" />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="bg-[#0A0A0A] rounded-lg p-2.5 border border-[#161616]">
            <div className="flex items-center gap-1.5 text-[#606060] mb-0.5">
              <Users size={12} />
              <span className="text-[10px] uppercase font-semibold">Users</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-sm">{agent.totalUsers}</p>
          </div>

          <div className="bg-[#0A0A0A] rounded-lg p-2.5 border border-[#161616]">
            <div className="flex items-center gap-1.5 text-[#606060] mb-0.5">
              <TrendingUp size={12} />
              <span className="text-[10px] uppercase font-semibold">Volume</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {formatTokenAmount(agent.totalVolume || agent.totalTradingVolume || '0')}
            </p>
          </div>

          <div className="bg-[#0A0A0A] rounded-lg p-2.5 border border-[#161616]">
            <div className="flex items-center gap-1.5 text-[#606060] mb-0.5">
              <Clock size={12} />
              <span className="text-[10px] uppercase font-semibold">Orders</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-sm">{totalOrders}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
