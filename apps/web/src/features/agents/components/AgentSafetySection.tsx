import { AlertTriangle, Zap } from 'lucide-react';
import { useAgentViolations } from '../hooks/useAgentViolations';
import { useAgentCircuitBreakers } from '../hooks/useAgentCircuitBreakers';
import { formatTimestamp } from '../utils/formatPolicy';

interface AgentSafetySectionProps {
  agentTokenId: string;
}

export default function AgentSafetySection({ agentTokenId }: AgentSafetySectionProps) {
  const { data: violationsData, isLoading: loadingViolations } = useAgentViolations(agentTokenId);
  const { data: breakersData, isLoading: loadingBreakers } = useAgentCircuitBreakers(agentTokenId);

  const violations = violationsData?.data || [];
  const breakers = breakersData?.data || [];
  const isLoading = loadingViolations || loadingBreakers;

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
        <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-3" />
        <div className="h-20 bg-[#0A0A0A] rounded" />
      </div>
    );
  }

  if (violations.length === 0 && breakers.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-[#606060]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Safety Events</h3>
        </div>
        <p className="text-[#606060] text-sm">No violations or circuit breaker events recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {violations.length > 0 && (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              Policy Violations ({violations.length})
            </h3>
          </div>
          <div className="divide-y divide-[#0A0A0A]">
            {violations.slice(0, 10).map((v) => (
              <div key={v.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-400">{v.violationType}</span>
                  <span className="text-xs text-[#606060]">{formatTimestamp(v.timestamp)}</span>
                </div>
                {v.details && <p className="text-xs text-[#808080] mt-1">{v.details}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {breakers.length > 0 && (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
            <Zap size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              Circuit Breakers ({breakers.length})
            </h3>
          </div>
          <div className="divide-y divide-[#0A0A0A]">
            {breakers.slice(0, 10).map((cb) => (
              <div key={cb.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">{cb.breakerType}</span>
                  <span className="text-xs text-[#606060]">{formatTimestamp(cb.timestamp)}</span>
                </div>
                {cb.reason && <p className="text-xs text-[#808080] mt-1">{cb.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
