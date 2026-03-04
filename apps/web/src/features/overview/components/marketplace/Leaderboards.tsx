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
  LeaderboardEntry,
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

function formatVolume(volume: string): string {
  const num = parseFloat(volume || "0");
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={14} className="text-[#F06718]" />;
  if (rank === 2) return <Medal size={14} className="text-[#AAAAAA]" />;
  if (rank === 3) return <Award size={14} className="text-[#888888]" />;
  return null;
}

function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-[#F06718] text-white";
  if (rank === 2) return "bg-[#333333] text-[#FFFFFF]";
  if (rank === 3) return "bg-[#222222] text-[#AAAAAA]";
  return "bg-[#1A1A1A] text-[#666666]";
}

// Skeleton components
function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 px-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#1A1A1A]" />
        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
          <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-5 w-20 bg-[#1A1A1A] rounded" />
        <div className="h-3 w-14 bg-[#1A1A1A] rounded" />
      </div>
    </div>
  );
}

function AgentLeaderboardRow({
  entry,
  index,
}: {
  entry: AgentLeaderboardEntry;
  index: number;
}) {
  const pnl = formatPnl(entry.realizedPnl);
  const rank = index + 1;
  const agentName =
    entry.metadata?.name || `Agent #${entry.agentTokenId.slice(0, 8)}`;
  const agentImage = entry.metadata?.image;

  return (
    <Link
      to="/agents/$agentTokenId"
      params={{ agentTokenId: entry.agentTokenId }}
    >
      <div className="flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer hover:bg-[#111111] transition-colors">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeStyle(
              rank
            )}`}
          >
            {getRankIcon(rank) || rank}
          </div>

          {/* Agent Avatar */}
          <div className="relative">
            {agentImage ? (
              <img
                src={agentImage}
                alt={agentName}
                className="w-10 h-10 rounded-xl object-cover border-2 border-[#222222]"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border-2 border-[#222222]">
                <Bot size={18} className="text-[#666666]" />
              </div>
            )}
          </div>

          {/* Agent Info */}
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-sm">
              {agentName}
            </span>
            <span className="text-[#666666] text-xs">
              {entry.managedUsers} user{entry.managedUsers !== 1 ? "s" : ""} -{" "}
              {formatVolume(entry.totalVolume)} vol
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end">
          <span
            className={`text-sm font-bold ${
              pnl.positive ? "text-[#F06718]" : "text-[#888888]"
            }`}
          >
            {pnl.value}
          </span>
          <span className="text-[#666666] text-xs">
            {(entry.winRate * 100).toFixed(0)}% win rate
          </span>
        </div>
      </div>
    </Link>
  );
}

function UserLeaderboardRow({
  entry,
  index,
}: {
  entry: UserLeaderboardEntry;
  index: number;
}) {
  const pnl = formatPnl(entry.realizedPnl);
  const rank = index + 1;

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-[#111111] transition-colors">
      <div className="flex items-center gap-3">
        {/* Rank Badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeStyle(
            rank
          )}`}
        >
          {getRankIcon(rank) || rank}
        </div>

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
          <User size={18} className="text-[#666666]" />
        </div>

        {/* User Info */}
        <div className="flex flex-col">
          <span className="text-[#FFFFFF] font-medium text-sm">
            {shortenAddress(entry.address)}
          </span>
          <span className="text-[#666666] text-xs">
            {entry.totalTrades} trades
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end">
        <span
          className={`text-sm font-bold ${
            pnl.positive ? "text-[#F06718]" : "text-[#888888]"
          }`}
        >
          {pnl.value}
        </span>
        <span className="text-[#666666] text-xs">
          {(entry.winRate * 100).toFixed(0)}% win rate
        </span>
      </div>
    </div>
  );
}

function LeaderboardCard({
  title,
  icon,
  entries,
  isLoading,
  type,
}: {
  title: string;
  icon: React.ReactNode;
  entries: LeaderboardEntry[];
  isLoading: boolean;
  type: "user" | "agent";
}) {
  return (
    <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] overflow-hidden hover:border-[#333333] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold">{title}</span>
            <span className="text-[#666666] text-xs">Past 7 days</span>
          </div>
        </div>
        <Link
          to="/leaderboard"
          className="flex items-center gap-1 text-[#888888] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-2">
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <LeaderboardRowSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mx-auto mb-3">
              {type === "agent" ? (
                <Bot size={24} className="text-[#444444]" />
              ) : (
                <User size={24} className="text-[#444444]" />
              )}
            </div>
            <span className="text-[#666666] text-sm">
              No data available yet
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            {entries.map((entry, index) =>
              type === "agent" ? (
                <AgentLeaderboardRow
                  key={entry.rank}
                  entry={entry as AgentLeaderboardEntry}
                  index={index}
                />
              ) : (
                <UserLeaderboardRow
                  key={entry.rank}
                  entry={entry as UserLeaderboardEntry}
                  index={index}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Time window tabs
const TIME_WINDOWS: { value: LeaderboardWindow; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export default function Leaderboards() {
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

  const userEntries = userLeaderboard?.data || [];
  const agentEntries = agentLeaderboard?.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Trophy size={20} className="text-[#FFFFFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-semibold text-lg">
              Leaderboards
            </span>
            <span className="text-[#666666] text-sm">
              Top performers this week
            </span>
          </div>
        </div>

        {/* Time Window Tabs */}
        <div className="flex items-center gap-1 bg-[#111111] rounded-full p-1 border border-[#1F1F1F]">
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw.value}
              type="button"
              onClick={() => setTimeWindow(tw.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                timeWindow === tw.value
                  ? "bg-[#F06718] text-white"
                  : "text-[#666666] hover:text-[#FFFFFF]"
              }`}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardCard
          title="Top Agents"
          icon={<Bot size={20} className="text-[#FFFFFF]" />}
          entries={agentEntries}
          isLoading={agentsLoading}
          type="agent"
        />
        <LeaderboardCard
          title="Top Traders"
          icon={<User size={20} className="text-[#FFFFFF]" />}
          entries={userEntries}
          isLoading={usersLoading}
          type="user"
        />
      </div>
    </div>
  );
}
