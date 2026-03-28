"use client";

import { useState } from "react";
import {
  Trophy,
  User,
  Bot,
  ChevronRight,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLeaderboard } from "@/features/leaderboard/hooks/useLeaderboard";
import type {
  UserLeaderboardEntry,
  AgentLeaderboardEntry,
  LeaderboardWindow,
} from "@/features/leaderboard/types/leaderboard.types";

function formatPnl(pnl: string): { value: string; positive: boolean } {
  const num = parseFloat(pnl || "0");
  const positive = num >= 0;
  const formatted =
    Math.abs(num) >= 1000
      ? `$${(Math.abs(num) / 1000).toFixed(1)}K`
      : `$${Math.abs(num).toFixed(2)}`;
  return { value: `${positive ? "+" : "-"}${formatted}`, positive };
}

function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={10} className="text-[#F06718]" />;
  if (rank === 2) return <Medal size={10} className="text-[#AAAAAA]" />;
  if (rank === 3) return <Award size={10} className="text-[#888888]" />;
  return null;
}

function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-[#F06718] text-white";
  if (rank === 2) return "bg-[#333333] text-[#FFFFFF]";
  if (rank === 3) return "bg-[#222222] text-[#AAAAAA]";
  return "bg-[#1A1A1A] text-[#666666]";
}

// Skeleton for mobile cards
function MobileLeaderCardSkeleton() {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-3 border border-[#1F1F1F] min-w-[160px] animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-[#1A1A1A]" />
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]" />
        <div className="flex-1">
          <div className="h-3 w-16 bg-[#1A1A1A] rounded mb-1" />
          <div className="h-2 w-12 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-14 bg-[#1A1A1A] rounded" />
        <div className="h-3 w-10 bg-[#1A1A1A] rounded" />
      </div>
    </div>
  );
}

function AgentCard({
  entry,
  index,
}: {
  entry: AgentLeaderboardEntry;
  index: number;
}) {
  const pnl = formatPnl(entry.realizedPnl);
  const rank = index + 1;
  const agentName =
    entry.metadata?.name || `Agent #${entry.agentTokenId.slice(0, 6)}`;
  const agentImage = entry.metadata?.image;

  return (
    <Link
      to="/agents/$agentTokenId"
      params={{ agentTokenId: entry.agentTokenId }}
    >
      <div className="bg-[#0C0C0C] rounded-2xl p-3 border border-[#1F1F1F] min-w-[160px] hover:border-[#333333] transition-colors">
        <div className="flex items-center gap-2 mb-2">
          {/* Rank */}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${getRankBadgeStyle(
              rank
            )}`}
          >
            {getRankIcon(rank) || rank}
          </div>

          {/* Avatar */}
          {agentImage ? (
            <img
              src={agentImage}
              alt={agentName}
              className="w-8 h-8 rounded-lg object-cover border border-[#222222]"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
              <Bot size={14} className="text-[#666666]" />
            </div>
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className="text-[#FFFFFF] text-xs font-semibold truncate block">
              {agentName}
            </span>
            <span className="text-[#666666] text-[10px]">
              {entry.managedUsers} users
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-bold ${
              pnl.positive ? "text-[#F06718]" : "text-[#888888]"
            }`}
          >
            {pnl.value}
          </span>
          <span className="text-[#666666] text-[10px]">
            {(entry.winRate * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </Link>
  );
}

function UserCard({
  entry,
  index,
}: {
  entry: UserLeaderboardEntry;
  index: number;
}) {
  const pnl = formatPnl(entry.realizedPnl);
  const rank = index + 1;

  return (
    <div className="bg-[#0C0C0C] rounded-2xl p-3 border border-[#1F1F1F] min-w-[160px] hover:border-[#333333] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {/* Rank */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${getRankBadgeStyle(
            rank
          )}`}
        >
          {getRankIcon(rank) || rank}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
          <User size={14} className="text-[#666666]" />
        </div>

        {/* Address */}
        <div className="flex-1 min-w-0">
          <span className="text-[#FFFFFF] text-xs font-medium truncate block">
            {shortenAddress(entry.address)}
          </span>
          <span className="text-[#666666] text-[10px]">
            {entry.totalTrades} trades
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-bold ${
            pnl.positive ? "text-[#F06718]" : "text-[#888888]"
          }`}
        >
          {pnl.value}
        </span>
        <span className="text-[#666666] text-[10px]">
          {(entry.winRate * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

const TIME_WINDOWS: { value: LeaderboardWindow; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export default function LeaderboardsMobile() {
  const [timeWindow, setTimeWindow] = useState<LeaderboardWindow>("7d");

  const { data: userLeaderboard, isLoading: usersLoading } = useLeaderboard({
    type: "user",
    sortBy: "pnl",
    window: timeWindow,
    limit: 5,
  });

  const { data: agentLeaderboard, isLoading: agentsLoading } = useLeaderboard({
    type: "agent",
    sortBy: "pnl",
    window: timeWindow,
    limit: 5,
  });

  const userEntries = (userLeaderboard?.data || []) as UserLeaderboardEntry[];
  const agentEntries = (agentLeaderboard?.data ||
    []) as AgentLeaderboardEntry[];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[#FFFFFF]" />
          <span className="text-[#FFFFFF] font-semibold">Leaderboards</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Time tabs */}
          <div className="flex items-center gap-0.5 bg-[#111111] rounded-full p-0.5 border border-[#1F1F1F]">
            {TIME_WINDOWS.map((tw) => (
              <button
                key={tw.value}
                type="button"
                onClick={() => setTimeWindow(tw.value)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  timeWindow === tw.value
                    ? "bg-[#F06718] text-white"
                    : "text-[#666666]"
                }`}
              >
                {tw.label}
              </button>
            ))}
          </div>
          <Link
            to="/leaderboard"
            className="text-[#888888] text-sm font-medium flex items-center gap-0.5 hover:text-[#FFFFFF] transition-colors"
          >
            All <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Top Agents */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-[#FFFFFF]" />
          <span className="text-[#FFFFFF] text-sm font-medium">Top Agents</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {agentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <MobileLeaderCardSkeleton key={i} />
            ))
          ) : agentEntries.length === 0 ? (
            <div className="bg-[#0C0C0C] rounded-2xl p-4 border border-[#1F1F1F] min-w-[200px] text-center">
              <Bot size={20} className="text-[#444444] mx-auto mb-1" />
              <span className="text-[#666666] text-xs">No agents yet</span>
            </div>
          ) : (
            agentEntries.map((entry, i) => (
              <AgentCard key={entry.agentTokenId} entry={entry} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Top Traders */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-[#FFFFFF]" />
          <span className="text-[#FFFFFF] text-sm font-medium">
            Top Traders
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {usersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <MobileLeaderCardSkeleton key={i} />
            ))
          ) : userEntries.length === 0 ? (
            <div className="bg-[#0C0C0C] rounded-2xl p-4 border border-[#1F1F1F] min-w-[200px] text-center">
              <User size={20} className="text-[#444444] mx-auto mb-1" />
              <span className="text-[#666666] text-xs">No traders yet</span>
            </div>
          ) : (
            userEntries.map((entry, i) => (
              <UserCard key={entry.address} entry={entry} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
