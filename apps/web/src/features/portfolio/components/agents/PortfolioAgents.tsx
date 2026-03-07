"use client";

import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useQueryClient } from "@tanstack/react-query";
import { AgentRouterABI, Contracts } from "@/configs/contracts";
import { useMyAgents } from "@/features/agents/hooks/useMyAgents";
import { usePendingActions } from "../../hooks/usePendingActions";
import PortfolioAgentCard from "./PortfolioAgentCard";
import PendingActionsTable from "./PendingActionsTable";

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "84532");

export default function PortfolioAgents() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address;
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string | null>(null);

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

  const handleRevoke = useCallback(async (agentTokenId: string) => {
    if (!confirm("Revoke this agent? It will no longer trade on your behalf.")) return;
    if (!address) return;
    setRevokingId(agentTokenId);
    try {
      const wallet = wallets.find((w) => w.walletClientType === "privy") || wallets[0];
      if (!wallet) throw new Error("No wallet");
      await wallet.switchChain(CHAIN_ID);
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });
      const { request } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: Contracts[CHAIN_ID].agentRouterAddress,
        abi: AgentRouterABI,
        functionName: "revoke",
        args: [BigInt(agentTokenId)],
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
      queryClient.invalidateQueries({ queryKey: ["myAgents"] });
    } catch (err) {
      console.error("Revoke failed:", err);
    } finally {
      setRevokingId(null);
    }
  }, [wallets, address, queryClient]);

  // Don't render if no wallet connected
  if (!address) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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
          to="/agents/my"
          className="text-xs text-[#606060] hover:text-[#E0E0E0] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Agent Cards — horizontal row, max 3 */}
      {agentsLoading ? (
        <div className="flex flex-row gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[280px] flex-shrink-0 bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : agents.length > 0 ? (
        <div className="flex flex-row gap-4 overflow-x-auto">
          {agents.slice(0, 3).map((agent) => (
            <div key={agent.agentTokenId} className="min-w-[280px] flex-shrink-0">
              <PortfolioAgentCard
                agent={agent}
                pendingCount={pendingByAgent.get(agent.agentTokenId) || 0}
                onRevoke={handleRevoke}
                isRevoking={revokingId === agent.agentTokenId}
              />
            </div>
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
