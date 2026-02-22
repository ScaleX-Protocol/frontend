import { Link } from '@tanstack/react-router';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useAgent } from '../hooks/useAgent';
import { useAgentStats } from '../hooks/useAgentStats';
import { useAgentPolicy } from '../hooks/useAgentPolicy';
import AgentAnalytics from './AgentAnalytics';
import AgentOrdersTable from './AgentOrdersTable';
import AgentPolicyDisplay from './AgentPolicyDisplay';
import AgentSafetySection from './AgentSafetySection';
import AuthorizeAgentButton from './AuthorizeAgentButton';
import { formatTokenAmount, formatTimestamp } from '../utils/formatPolicy';
import type { AgentInstallation } from '../types/agents.types';

interface AgentDetailProps {
  agentTokenId: string | undefined;
}

export default function AgentDetail({ agentTokenId }: AgentDetailProps) {
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  const { data: agentData, isLoading: loadingAgent, error: agentError } = useAgent(agentTokenId);
  const { data: statsData } = useAgentStats(agentTokenId);
  const { data: policyData } = useAgentPolicy(agentTokenId);

  if (!agentTokenId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#606060]">Invalid agent ID</p>
      </div>
    );
  }

  if (loadingAgent) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-4">
        <div className="h-8 w-48 bg-[#1A1A1A] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`detail-skeleton-${i}`} className="h-20 bg-[#111111] border border-[#1F1F1F] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#111111] border border-[#1F1F1F] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (agentError || !agentData?.data) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <p className="text-[#808080]">Agent not found</p>
        <Link to="/agents" className="text-sm text-[#F06718] hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const agent = agentData.data;
  const stats = statsData?.data;
  const policies = policyData?.data;
  const firstPolicy = Array.isArray(policies) ? policies[0] : policies;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Back + Header */}
      <div>
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-[#606060] hover:text-[#E0E0E0] mb-3">
          <ArrowLeft size={14} />
          Back to marketplace
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#FFFFFF]">Agent #{agentTokenId}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#808080]">
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {agent.activeUsers} active / {agent.totalUsers} users
              </span>
              {agent.firstInstalledAt && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Since {formatTimestamp(Number(agent.firstInstalledAt))}
                </span>
              )}
            </div>
          </div>

          {/* Authorize/Revoke Button (desktop) */}
          <div className="hidden md:block w-56">
            <AuthorizeAgentButton agentTokenId={agentTokenId} walletAddress={walletAddress} />
          </div>
        </div>
      </div>

      {/* Analytics */}
      <AgentAnalytics agentTokenId={agentTokenId} />

      {/* Stats Summary */}
      {stats?.agentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <span className="text-[#606060] text-xs">Trading Volume</span>
            <p className="text-[#E0E0E0] font-semibold text-sm mt-1">
              {formatTokenAmount(stats.agentStats.totalTradingVolume || '0')} IDRX
            </p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <span className="text-[#606060] text-xs">Market Orders</span>
            <p className="text-[#E0E0E0] font-semibold text-sm mt-1">{stats.agentStats.totalMarketOrders}</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <span className="text-[#606060] text-xs">Limit Orders</span>
            <p className="text-[#E0E0E0] font-semibold text-sm mt-1">{stats.agentStats.totalLimitOrders}</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <span className="text-[#606060] text-xs">Cancelled</span>
            <p className="text-[#E0E0E0] font-semibold text-sm mt-1">{stats.agentStats.totalOrdersCancelled}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <AgentOrdersTable agentTokenId={agentTokenId} />

      {/* Safety Section */}
      <AgentSafetySection agentTokenId={agentTokenId} />

      {/* Policy Display */}
      {firstPolicy && 'policy' in firstPolicy && (
        <AgentPolicyDisplay policy={(firstPolicy as AgentInstallation).policy} />
      )}

      {/* Authorize/Revoke Button (mobile) */}
      <div className="md:hidden">
        <AuthorizeAgentButton agentTokenId={agentTokenId} walletAddress={walletAddress} />
      </div>
    </div>
  );
}
