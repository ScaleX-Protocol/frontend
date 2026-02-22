import { Link } from '@tanstack/react-router';
import { ExternalLink, Clock } from 'lucide-react';
import type { AgentInstallation } from '../types/agents.types';
import { formatRelativeTime } from '../utils/formatPolicy';

interface MyAgentCardProps {
  agent: AgentInstallation;
  onRevoke: (agentTokenId: string) => void;
  isRevoking?: boolean;
}

export default function MyAgentCard({ agent, onRevoke, isRevoking }: MyAgentCardProps) {
  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
            <span className="text-[#F06718] font-bold text-sm">#{agent.agentTokenId}</span>
          </div>
          <div>
            <h3 className="text-[#FFFFFF] font-semibold text-sm">Agent #{agent.agentTokenId}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              agent.enabled
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

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <span className="text-[#606060] text-xs">Template</span>
          <p className="text-[#E0E0E0] text-sm font-medium capitalize">{agent.policy.templateUsed}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <span className="text-[#606060] text-xs">Max Slippage</span>
          <p className="text-[#E0E0E0] text-sm font-medium">
            {Number(agent.policy.maxSlippageBps) / 100}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#606060] text-xs">
          <Clock size={12} />
          <span>Installed {formatRelativeTime(agent.installedAt)}</span>
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
