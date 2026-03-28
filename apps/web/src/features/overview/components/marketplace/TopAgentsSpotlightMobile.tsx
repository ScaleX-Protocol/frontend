"use client";

import { useState } from "react";
import {
  Bot,
  TrendingUp,
  Users,
  ChevronRight,
  Crown,
  Activity,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLeaderboard } from "@/features/leaderboard/hooks/useLeaderboard";
import type { AgentLeaderboardEntry } from "@/features/leaderboard/types/leaderboard.types";

function formatPnl(pnl: string): { value: string; positive: boolean } {
  const num = parseFloat(pnl || "0");
  const positive = num >= 0;
  const formatted =
    Math.abs(num) >= 1000
      ? `$${(Math.abs(num) / 1000).toFixed(1)}K`
      : `$${Math.abs(num).toFixed(2)}`;
  return { value: `${positive ? "+" : "-"}${formatted}`, positive };
}

function formatVolume(volume: string): string {
  const num = parseFloat(volume || "0");
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function SpotlightCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square w-full bg-[#0A0A0A]" />
      <div className="p-3">
        <div className="h-4 w-20 bg-[#1A1A1A] rounded mb-2" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-[#0A0A0A] rounded-lg p-2 h-12" />
          <div className="bg-[#0A0A0A] rounded-lg p-2 h-12" />
          <div className="bg-[#0A0A0A] rounded-lg p-2 h-12" />
        </div>
      </div>
    </div>
  );
}

function AgentCard({
  entry,
  rank,
}: {
  entry: AgentLeaderboardEntry;
  rank: number;
}) {
  const pnl = formatPnl(entry.realizedPnl);
  const agentName = entry.metadata?.name || `Agent #${entry.agentTokenId}`;
  const agentImage = entry.metadata?.image;
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to="/agents/$agentTokenId"
      params={{ agentTokenId: entry.agentTokenId }}
      className="group block bg-[#111111] border border-[#222222] rounded-xl overflow-hidden hover:border-[#333333] transition-colors"
    >
      {/* Agent Image */}
      <div className="relative aspect-square w-full bg-[#0A0A0A] overflow-hidden border-b border-[#1F1F1F]">
        {agentImage && !imgError ? (
          <img
            src={agentImage}
            alt={agentName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bot className="text-[#F06718]/30 w-10 h-10" />
          </div>
        )}

        {/* Rank Badge */}
        <div className="absolute top-1.5 left-1.5">
          <div
            className={`flex items-center justify-center rounded-md backdrop-blur-md border border-white/10 font-bold ${
              rank === 1
                ? "w-6 h-6 bg-[#F06718]/90 text-white text-xs"
                : "w-5 h-5 bg-black/60 text-[#888888] text-[10px]"
            }`}
          >
            {rank === 1 ? <Crown size={12} /> : `#${rank}`}
          </div>
        </div>

        {/* PnL Badge */}
        <div className="absolute top-1.5 right-1.5">
          <span
            className={`px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold ${
              pnl.positive ? "text-[#F06718]" : "text-[#888888]"
            }`}
          >
            {pnl.value}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-[#FFFFFF] font-semibold text-xs truncate mb-2">
          {agentName}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-[#0A0A0A] rounded-md p-2 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 text-[#606060] text-[9px] mb-0.5">
              <Users size={10} className="shrink-0" />
              <span>Users</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-[10px] truncate">
              {entry.managedUsers}
            </p>
          </div>
          <div className="bg-[#0A0A0A] rounded-md p-2 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 text-[#606060] text-[9px] mb-0.5">
              <TrendingUp size={10} className="shrink-0" />
              <span>Vol</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-[10px] truncate">
              {formatVolume(entry.totalVolume)}
            </p>
          </div>
          <div className="bg-[#0A0A0A] rounded-md p-2 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 text-[#606060] text-[9px] mb-0.5">
              <Activity size={10} className="shrink-0" />
              <span>Win</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-[10px] truncate">
              {(entry.winRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TopAgentsSpotlightMobile() {
  const { data: agentLeaderboard, isLoading } = useLeaderboard({
    type: "agent",
    sortBy: "pnl",
    window: "7d",
    limit: 3,
  });

  const topAgents = (agentLeaderboard?.data || []) as AgentLeaderboardEntry[];

  if (!isLoading && topAgents.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#FFFFFF]" />
          <span className="text-[#FFFFFF] font-semibold">Top Agents</span>
        </div>
        <Link
          to="/agents"
          className="text-[#F06718] text-sm font-medium flex items-center gap-0.5"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <SpotlightCardSkeleton />
          <SpotlightCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {topAgents.slice(0, 2).map((agent, index) => (
            <AgentCard
              key={agent.agentTokenId}
              entry={agent}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
