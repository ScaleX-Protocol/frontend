import { Link } from '@tanstack/react-router';
import { Users, TrendingUp, Clock } from 'lucide-react';
import type { AgentMarketplaceItem } from '../types/agents.types';
import { formatTokenAmount, formatRelativeTime } from '../utils/formatPolicy';

interface AgentCardProps {
  agent: AgentMarketplaceItem;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const totalOrders = (agent.totalMarketOrders || 0) + (agent.totalLimitOrders || 0);

  return (
    <Link
      to="/agents/$agentTokenId"
      params={{ agentTokenId: agent.agentTokenId }}
      className="block bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 hover:border-[#333333] hover:bg-[#161616] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
            <span className="text-[#F06718] font-bold text-sm">#{agent.agentTokenId}</span>
          </div>
          <div>
            <h3 className="text-[#FFFFFF] font-semibold text-sm">Agent #{agent.agentTokenId}</h3>
            <div className="flex items-center gap-1 text-[#606060] text-xs">
              <Users size={12} />
              <span>{agent.activeUsers} active / {agent.totalUsers} total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <TrendingUp size={12} />
            <span>Volume</span>
          </div>
          <p className="text-[#E0E0E0] font-medium text-sm">
            {formatTokenAmount(agent.totalTradingVolume || '0')} IDRX
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
