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
      className="block bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 hover:border-[#333333] hover:bg-[#161616] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {metadata?.image && !imgError ? (
            <img
              src={metadata.image}
              alt={agentName}
              className="w-10 h-10 rounded-lg object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              loadingMetadata ? 'bg-[#1A1A1A] animate-pulse' : 'bg-[#F06718]/10'
            }`}>
              {!loadingMetadata && (
                <Bot size={18} className="text-[#F06718]" />
              )}
            </div>
          )}
          <div>
            {loadingMetadata ? (
              <div className="h-4 w-28 bg-[#1A1A1A] rounded animate-pulse" />
            ) : (
              <h3 className="text-[#FFFFFF] font-semibold text-sm">{agentName}</h3>
            )}
            <div className="flex items-center gap-1 text-[#606060] text-xs mt-0.5">
              <Users size={12} />
              <span>{agent.activeUsers} active / {agent.totalUsers} total</span>
            </div>
          </div>
        </div>
        {riskAttr && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            riskAttr.value === 'High' ? 'bg-red-500/10 text-red-400' :
            riskAttr.value === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-green-500/10 text-green-400'
          }`}>
            {riskAttr.value}
          </span>
        )}
      </div>

      {metadata?.description && (
        <p className="text-[#808080] text-xs mb-3 line-clamp-2">{metadata.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <TrendingUp size={12} />
            <span>Volume</span>
          </div>
          <p className="text-[#E0E0E0] font-medium text-sm">
            {formatTokenAmount(agent.totalVolume || agent.totalTradingVolume || '0')} IDRX
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <div className="text-[#606060] text-xs mb-1">Orders</div>
          <p className="text-[#E0E0E0] font-medium text-sm">{totalOrders}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[#606060] text-xs">
        <Clock size={12} />
        <span>Last active: {formatRelativeTime(agent.lastActivityAt || 0)}</span>
      </div>
    </Link>
  );
}
