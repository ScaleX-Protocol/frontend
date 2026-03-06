"use client";

import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { useWalletState } from "@/hooks/useWalletState";
import { useMyAgents } from "@/features/agents/hooks/useMyAgents";
import { usePendingActions } from "../../hooks/usePendingActions";
import PortfolioAgentCard from "./PortfolioAgentCard";
import PendingActionsTable from "./PendingActionsTable";

export default function PortfolioAgents() {
  const wallet = useWalletState();
  const address = wallet?.address;

  const { data: agentsData, isLoading: agentsLoading } = useMyAgents(address);
  const { data: pendingData, isLoading: pendingLoading } = usePendingActions(address);

  const agents = agentsData?.data || [];
  const awaitingSettlement = pendingData?.data?.awaitingSettlement || [];
  const claimable = pendingData?.data?.claimable || [];
  const totalPending = awaitingSettlement.length + claimable.length;

  // Count pending actions per agent
  const pendingByAgent = new Map<string, number>();
  for (const m of awaitingSettlement) {
    if (m.agentTokenId) {
      pendingByAgent.set(m.agentTokenId, (pendingByAgent.get(m.agentTokenId) || 0) + 1);
    }
  }
  for (const c of claimable) {
    if (c.agentTokenId) {
      pendingByAgent.set(c.agentTokenId, (pendingByAgent.get(c.agentTokenId) || 0) + 1);
    }
  }

  // Don't render if no wallet connected
  if (!address) return null;

  // Don't render section if no agents and no pending actions
  if (!agentsLoading && !pendingLoading && agents.length === 0 && totalPending === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* My Agents Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">My Agents</span>
          {totalPending > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F97316]/10 text-[#F97316] animate-pulse">
              {totalPending}
            </span>
          )}
        </div>
        <Link
          to="/agents"
          className="text-xs text-[#606060] hover:text-[#E0E0E0] transition-colors"
        >
          View All Agents
        </Link>
      </div>

      {/* Agent Cards Grid */}
      {agentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <PortfolioAgentCard
              key={agent.agentTokenId}
              agent={agent}
              pendingCount={pendingByAgent.get(agent.agentTokenId) || 0}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
            <Bot size={24} className="text-[#F06718]" />
          </div>
          <span className="text-[#808080] text-sm">No agents authorized yet</span>
          <Link
            to="/agents"
            className="text-xs text-[#F97316] hover:text-[#F97316]/80 transition-colors"
          >
            Browse Agents
          </Link>
        </div>
      )}

      {/* Pending Actions */}
      {pendingLoading ? (
        <div className="bg-[#0A0A0A] rounded-lg p-4 h-20 animate-pulse" />
      ) : totalPending > 0 ? (
        <PendingActionsTable
          awaitingSettlement={awaitingSettlement}
          claimable={claimable}
        />
      ) : null}
    </div>
  );
}
