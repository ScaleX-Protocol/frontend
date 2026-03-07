import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ExternalLink, Bot, Clock } from 'lucide-react';
import type { AgentInstallation } from '@/features/agents/types/agents.types';
import { useAgentMetadata } from '@/features/agents/hooks/useAgentMetadata';
import { useAgentOrders } from '@/features/agents/hooks/useAgentOrders';
import { formatRelativeTime } from '@/features/agents/utils/formatPolicy';

interface PortfolioAgentCardProps {
  agent: AgentInstallation;
  pendingCount: number;
  onRevoke: (agentTokenId: string) => void;
  isRevoking?: boolean;
}

export default function PortfolioAgentCard({ agent, pendingCount, onRevoke, isRevoking }: PortfolioAgentCardProps) {
  const { data: metadata } = useAgentMetadata(agent.agentTokenId);
  const { data: ordersData } = useAgentOrders(agent.agentTokenId, { limit: 3 });
  const [imgError, setImgError] = useState(false);

  const agentName = metadata?.name || `Agent #${agent.agentTokenId}`;
  const recentOrders = ordersData?.data || [];

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 flex flex-col gap-3">
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {metadata?.image && !imgError ? (
            <img
              src={metadata.image}
              alt={agentName}
              className="w-10 h-10 rounded-lg object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
              <Bot size={18} className="text-[#F06718]" />
            </div>
          )}
          <div>
            <h3 className="text-[#FFFFFF] font-semibold text-sm">{agentName}</h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                agent.enabled
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-[#1A1A1A] text-[#606060]'
              }`}>
                {agent.enabled ? 'Active' : 'Disabled'}
              </span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F97316]/10 text-[#F97316] animate-pulse">
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          to="/agents/$agentTokenId"
          params={{ agentTokenId: agent.agentTokenId }}
          className="text-[#606060] hover:text-[#E0E0E0] transition-colors"
        >
          <ExternalLink size={16} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0A0A0A] rounded-lg p-2.5">
          <span className="text-[#606060] text-xs">Template</span>
          <p className="text-[#E0E0E0] text-sm font-medium capitalize">{agent.policy?.templateUsed || 'Custom'}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-2.5">
          <span className="text-[#606060] text-xs">Installed</span>
          <p className="text-[#E0E0E0] text-sm font-medium">{formatRelativeTime(agent.installedAt)}</p>
        </div>
      </div>

      {/* Recent Activity (last 3 orders) */}
      {recentOrders.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[#606060] text-xs font-medium">Recent Activity</span>
          {recentOrders.map((order: { id: string; side: string; type: string; timestamp: number }) => (
            <div key={order.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`font-medium ${
                  order.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {order.side}
                </span>
                <span className="text-[#808080]">{order.type}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#606060]">
                <Clock size={10} />
                <span>{formatRelativeTime(order.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1F1F1F]">
        <Link
          to="/agents/$agentTokenId"
          params={{ agentTokenId: agent.agentTokenId }}
          className="text-xs text-[#F97316] hover:text-[#F97316]/80 transition-colors"
        >
          View Details
        </Link>
        <button
          type="button"
          onClick={() => onRevoke(agent.agentTokenId)}
          disabled={isRevoking}
          className="text-xs text-[#606060] hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {isRevoking ? "Revoking..." : "Revoke"}
        </button>
      </div>
    </div>
  );
}
