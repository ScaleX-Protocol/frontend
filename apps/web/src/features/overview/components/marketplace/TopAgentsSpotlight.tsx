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
      <div className="p-4">
        <div className="h-4 w-28 bg-[#1A1A1A] rounded mb-2" />
        <div className="h-3 w-full bg-[#1A1A1A] rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0A0A0A] rounded-lg p-3 h-14" />
          <div className="bg-[#0A0A0A] rounded-lg p-3 h-14" />
          <div className="bg-[#0A0A0A] rounded-lg p-3 h-14" />
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({
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
      className="group block bg-[#111111] border border-[#222222] rounded-xl overflow-hidden hover:border-[#333333] hover:bg-[#161616] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300"
    >
      {/* Agent Image */}
      <div className="relative aspect-square w-full bg-[#0A0A0A] overflow-hidden border-b border-[#1F1F1F]">
        {agentImage && !imgError ? (
          <img
            src={agentImage}
            alt={agentName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bot className="text-[#F06718]/30 w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}

        {/* Rank Badge */}
        <div className="absolute top-2 left-2">
          <div
            className={`flex items-center justify-center rounded-lg backdrop-blur-md border border-white/10 font-bold ${
              rank === 1
                ? "w-8 h-8 bg-[#F06718]/90 text-white"
                : rank === 2
                ? "w-7 h-7 bg-black/60 text-[#CCCCCC] text-sm"
                : "w-7 h-7 bg-black/60 text-[#888888] text-sm"
            }`}
          >
            {rank === 1 ? <Crown size={16} /> : `#${rank}`}
          </div>
        </div>

        {/* PnL Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold ${
              pnl.positive ? "text-[#F06718]" : "text-[#888888]"
            }`}
          >
            {pnl.value}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#FFFFFF] font-semibold text-sm truncate">
            {agentName}
          </h3>
        </div>
        {entry.metadata?.description && (
          <p className="text-[#808080] text-xs mb-3 line-clamp-2">
            {entry.metadata.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <Users size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Users</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">
              {entry.managedUsers}
            </p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <TrendingUp size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Vol</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">
              {formatVolume(entry.totalVolume)}
            </p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 sm:p-3 flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#606060] text-[10px] sm:text-xs mb-1">
              <Activity size={12} className="shrink-0" />
              <span className="whitespace-nowrap">Win</span>
            </div>
            <p className="text-[#E0E0E0] font-medium text-xs sm:text-sm truncate">
              {(entry.winRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TopAgentsSpotlight() {
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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <TrendingUp size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">
              Top Performing Agents
            </span>
            <span className="text-[#666666] text-sm">
              Best traders this week
            </span>
          </div>
        </div>
        <Link
          to="/agents"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <SpotlightCardSkeleton />
          <SpotlightCardSkeleton />
          <SpotlightCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {topAgents.map((agent, index) => (
            <SpotlightCard
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
