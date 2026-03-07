import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ExternalLink, Clock, Bot } from 'lucide-react';
import type { AgentInstallation } from '../types/agents.types';
import { formatRelativeTime, formatTokenAmount } from '../utils/formatPolicy';
import { useAgentMetadata } from '../hooks/useAgentMetadata';
import { useAgentPolicy } from '../hooks/useAgentPolicy';

interface MyAgentCardProps {
  agent: AgentInstallation;
  ownerAddress: string;
  onRevoke: (agentTokenId: string) => void;
  isRevoking?: boolean;
}

const PERMISSION_LABELS: Record<string, string> = {
  allowMarketOrders: 'Market Orders',
  allowLimitOrders: 'Limit Orders',
  allowBuy: 'Buy',
  allowSell: 'Sell',
  allowSwap: 'Swap',
  allowBorrow: 'Borrow',
  allowRepay: 'Repay',
  allowSupplyCollateral: 'Supply Collateral',
  allowWithdrawCollateral: 'Withdraw Collateral',
  allowPlaceLimitOrder: 'Place Limit',
  allowCancelOrder: 'Cancel Order',
  allowAutoBorrow: 'Auto-Borrow',
  allowAutoRepay: 'Auto-Repay',
  allowPredict: 'Predict',
  allowClaimPrediction: 'Claim Prediction',
};

export default function MyAgentCard({ agent, ownerAddress, onRevoke, isRevoking }: MyAgentCardProps) {
  const { data: metadata } = useAgentMetadata(agent.agentTokenId, agent.metadataURI);
  const { data: policyResponse } = useAgentPolicy(agent.agentTokenId, ownerAddress);
  const [imgError, setImgError] = useState(false);

  const agentName = metadata?.name || `Agent #${agent.agentTokenId}`;
  const policy = Array.isArray(policyResponse?.data) ? policyResponse.data[0] : policyResponse?.data;

  const enabledPermissions = Object.entries(PERMISSION_LABELS).filter(
    ([key]) => policy && (policy as any)[key] === true
  );

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
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
            <div className="w-10 h-10 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
              <Bot size={18} className="text-[#F06718]" />
            </div>
          )}
          <div>
            <h3 className="text-[#FFFFFF] font-semibold text-sm">{agentName}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${agent.enabled
                ? 'bg-green-500/10 text-green-400'
                : 'bg-[#1A1A1A] text-[#606060]'
              }`}>
              {agent.enabled ? 'Active' : 'Disabled'}
            </span>
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

      <div className="mb-3">
        <span className="text-[#606060] text-xs mb-2 block">Permissions</span>
        {!policy ? (
          <p className="text-[#404040] text-xs italic">No policy found</p>
        ) : enabledPermissions.length === 0 ? (
          <p className="text-[#404040] text-xs italic">No permissions granted</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {enabledPermissions.map(([key, label]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Orders / Volume stats */}
      {((agent.totalOrders ?? 0) > 0 || agent.totalVolume !== '0') && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {(agent.totalOrders ?? 0) > 0 && (
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <span className="text-[#606060] text-xs">Orders</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{agent.totalOrders}</p>
            </div>
          )}
          {agent.totalVolume && agent.totalVolume !== '0' && (
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <span className="text-[#606060] text-xs">Volume</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{formatTokenAmount(agent.totalVolume)} USDC</p>
            </div>
          )}
        </div>
      )}

      {/* Lending / Prediction activity */}
      {((agent.totalPredictions ?? 0) > 0 || (agent.totalBorrows ?? 0) > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {(agent.totalPredictions ?? 0) > 0 && (
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <span className="text-[#606060] text-xs">Predictions</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {agent.totalPredictions}
                {(agent.totalPredictionClaims ?? 0) > 0 && (
                  <span className="text-[#606060] text-xs ml-1">({agent.totalPredictionClaims} claimed)</span>
                )}
              </p>
            </div>
          )}
          {(agent.totalBorrows ?? 0) > 0 && (
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <span className="text-[#606060] text-xs">Borrows</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{agent.totalBorrows}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#606060] text-xs">
          <Clock size={12} />
          <span>Installed {agent.installedAt ? formatRelativeTime(agent.installedAt) : 'Unknown'}</span>
        </div>
        <button
          type="button"
          onClick={() => onRevoke(agent.agentTokenId)}
          disabled={isRevoking}
          className="px-3 py-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </button>
      </div>
    </div>
  );
}
