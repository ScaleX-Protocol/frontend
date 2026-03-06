import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Users, TrendingUp, ShoppingCart, XCircle, Clock, Bot, Target, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useAgent } from '../hooks/useAgent';
import { useAgentStats } from '../hooks/useAgentStats';
import { useAgentPolicy } from '../hooks/useAgentPolicy';
import { useAgentMetadata } from '../hooks/useAgentMetadata';
import AgentAnalytics from './AgentAnalytics';
import AgentOrdersTable from './AgentOrdersTable';
import AgentPredictionsTable from './AgentPredictionsTable';
import AgentLendingTable from './AgentLendingTable';
import AgentUsersTable from './AgentUsersTable';
import AgentPolicyDisplay from './AgentPolicyDisplay';
import AgentSafetySection from './AgentSafetySection';
import AuthorizeAgentButton from './AuthorizeAgentButton';
import AgentChatPanel from './AgentChatPanel';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import { formatTokenAmount, formatTimestamp } from '../utils/formatPolicy';
import type { AgentInstallation } from '../types/agents.types';

interface AgentDetailProps {
  agentTokenId: string | undefined;
}

export default function AgentDetail({ agentTokenId }: AgentDetailProps) {
  const { wallets } = useWallets();
  const walletAddress = wallets.find((w) => w.walletClientType === 'privy')?.address;
  const isMobile = useIsMobile();
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

  const containerClass = isMobile
    ? "w-full flex-1 flex flex-col gap-6 p-5 pb-[24px] overflow-y-auto"
    : "w-full flex-1 p-6 flex flex-col gap-6 overflow-y-auto";

  return (
    <div className={containerClass}>
      {/* Back + Header */}
      <div>
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-[#606060] hover:text-[#E0E0E0] mb-3">
          <ArrowLeft size={14} />
          Back to marketplace
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {metadata?.image && !imgError ? (
              <img
                src={metadata.image}
                alt={agentName}
                className="w-24 h-24 rounded-2xl object-contain bg-[#0A0A0A] shrink-0"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#F06718]/10 flex items-center justify-center shrink-0">
                <Bot size={36} className="text-[#F06718]" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
                <a
                  href={`https://testnet.8004scan.io/agents/base-sepolia/${agentTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#1A1A1A] text-[#808080] hover:text-[#F06718] hover:bg-[#1F1F1F] transition-colors"
                >
                  <ExternalLink size={10} />
                  8004scan
                </a>
              </div>

              {metadata?.description && (
                <p className="text-[#808080] text-sm mt-1 max-w-lg">{metadata.description}</p>
              )}

              {agent.firstInstalledAt && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#606060]">
                  <Clock size={12} />
                  <span>First active {formatTimestamp(Number(agent.firstInstalledAt))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Authorize/Revoke Button (desktop) */}
          <div className="hidden md:block w-56 shrink-0">
            <AuthorizeAgentButton agentTokenId={agentTokenId} walletAddress={walletAddress} serviceUrl={metadata?.service_url} />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <Users size={12} />
            <span>Total Users</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">{agent.totalUsers}</p>
          <p className="text-[#606060] text-xs mt-0.5">{agent.activeUsers} active</p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <TrendingUp size={12} />
            <span>Trading Volume</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">
            {Number(stats?.agentStats?.totalTradingVolume || '0').toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[#606060] text-xs mt-0.5">IDRX</p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <ShoppingCart size={12} />
            <span>Total Orders</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">
            {(stats?.agentStats?.totalMarketOrders || 0) + (stats?.agentStats?.totalLimitOrders || 0)}
          </p>
          <p className="text-[#606060] text-xs mt-0.5">
            {stats?.agentStats?.totalMarketOrders || 0} market · {stats?.agentStats?.totalLimitOrders || 0} limit
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <XCircle size={12} />
            <span>Cancelled</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">{stats?.agentStats?.totalOrdersCancelled || 0}</p>
          <p className="text-[#606060] text-xs mt-0.5">orders cancelled</p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <Target size={12} />
            <span>Predictions</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">
            {agent.aggregateStats?.totalPredictions || 0}
          </p>
          <p className="text-[#606060] text-xs mt-0.5">
            {agent.aggregateStats?.totalPredictionClaims || 0} claimed
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-1">
            <TrendingUp size={12} />
            <span>Pred. Volume</span>
          </div>
          <p className="text-[#E0E0E0] font-semibold text-lg">
            {formatTokenAmount(agent.aggregateStats?.totalPredictionVolume || '0')}
          </p>
          <p className="text-[#606060] text-xs mt-0.5">IDRX</p>
        </div>
      </div>

      {/* Users Table */}
      <AgentUsersTable agentTokenId={agentTokenId} />

      {/* Analytics */}
      <AgentAnalytics agentTokenId={agentTokenId} />

      {/* Orders Table */}
      <AgentOrdersTable agentTokenId={agentTokenId} />

      {/* Predictions Table */}
      <AgentPredictionsTable agentTokenId={agentTokenId} />

      {/* Lending Table */}
      <AgentLendingTable agentTokenId={agentTokenId} />

      {/* Safety Section */}
      <AgentSafetySection agentTokenId={agentTokenId} />

      {/* Policy Display */}
      {firstPolicy && 'policy' in firstPolicy && (
        <AgentPolicyDisplay policy={(firstPolicy as AgentInstallation).policy} />
      )}

      {/* Authorize/Revoke Button (mobile) */}
      <div className="md:hidden">
        <AuthorizeAgentButton agentTokenId={agentTokenId} walletAddress={walletAddress} serviceUrl={metadata?.service_url} />
      </div>

      {/* Floating Chat Panel */}
      <AgentChatPanel
        agentTokenId={agentTokenId}
        agentName={agentName}
        agentImage={metadata?.image}
        serviceUrl={metadata?.service_url}
      />
    </div>
  );
}
