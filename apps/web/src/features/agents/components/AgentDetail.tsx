import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Users, Clock, Bot } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useAgent } from '../hooks/useAgent';
import { useAgentStats } from '../hooks/useAgentStats';
import { useAgentPolicy } from '../hooks/useAgentPolicy';
import { useAgentMetadata } from '../hooks/useAgentMetadata';
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
  const [imgError, setImgError] = useState(false);

  const { data: agentData, isLoading: loadingAgent, error: agentError } = useAgent(agentTokenId);
  const { data: statsData } = useAgentStats(agentTokenId);
  const { data: policyData } = useAgentPolicy(agentTokenId);
  const { data: metadata } = useAgentMetadata(agentTokenId);

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

  const agentName = metadata?.name || `Agent #${agentTokenId}`;
  const riskAttr = metadata?.attributes?.find(a => a.trait_type === 'Risk Level');
  const categoryAttr = metadata?.attributes?.find(a => a.trait_type === 'Category');

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Back + Header */}
      <div>
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-[#606060] hover:text-[#E0E0E0] mb-3">
          <ArrowLeft size={14} />
          Back to marketplace
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {metadata?.image && !imgError ? (
              <img
                src={metadata.image}
                alt={agentName}
                className="w-14 h-14 rounded-xl object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#F06718]/10 flex items-center justify-center">
                <Bot size={24} className="text-[#F06718]" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#FFFFFF]">{agentName}</h1>
                {riskAttr && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    riskAttr.value === 'High' ? 'bg-red-500/10 text-red-400' :
                    riskAttr.value === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    {riskAttr.value} Risk
                  </span>
                )}
                {categoryAttr && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#1A1A1A] text-[#808080]">
                    {categoryAttr.value}
                  </span>
                )}
              </div>

              {metadata?.description && (
                <p className="text-[#808080] text-sm mt-1 max-w-lg">{metadata.description}</p>
              )}

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
