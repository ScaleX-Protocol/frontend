"use client";

import { ExternalLink, Bot } from "lucide-react";
import type { ActivityItem } from "../../types/activity.types";

const TYPE_COLORS: Record<string, string> = {
  trading: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  lending: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30",
  agent: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30",
  prediction: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30",
  transfer: "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30",
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function formatSubtype(subtype: string): string {
  return subtype
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAmount(amount: string, tokenSymbol: string | null): string {
  const num = parseFloat(amount);
  if (isNaN(num) || num === 0) return "-";
  const formatted = num >= 1e6
    ? `${(num / 1e6).toFixed(2)}M`
    : num >= 1e3
    ? `${(num / 1e3).toFixed(2)}K`
    : num.toFixed(num < 1 ? 6 : 2);
  return tokenSymbol ? `${formatted} ${tokenSymbol}` : formatted;
}

function getDetailsText(item: ActivityItem): string {
  const meta = item.metadata;
  switch (item.type) {
    case "trading": {
      const side = (meta.side as string) || "";
      const price = meta.price ? parseFloat(meta.price as string) : 0;
      return `${side} @ ${price > 0 ? price.toFixed(2) : "-"}`;
    }
    case "lending":
      return formatSubtype(item.subtype);
    case "agent": {
      if (item.subtype === "policy_violation") return `Violation: ${meta.reason || "Unknown"}`;
      if (item.subtype === "circuit_breaker") return "Circuit breaker triggered";
      return formatSubtype(item.subtype);
    }
    case "prediction": {
      const marketId = meta.marketId as string;
      const predictedUp = meta.predictedUp as boolean | null;
      if (item.subtype === "claimed") return `Claimed from Market #${marketId}`;
      return `${predictedUp ? "UP" : "DOWN"} on Market #${marketId}`;
    }
    case "transfer":
      return item.subtype === "deposit" ? "Deposit" : "Withdrawal";
    default:
      return formatSubtype(item.subtype);
  }
}

interface ActivityItemCardProps {
  item: ActivityItem;
}

export default function ActivityItemCard({ item }: ActivityItemCardProps) {
  return (
    <div className="bg-[#111111] rounded-[12px] border border-[#1F1F1F] p-4 flex flex-col gap-2">
      {/* Header: Type badge + Agent icon | Timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
              TYPE_COLORS[item.type] || TYPE_COLORS.trading
            }`}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          {item.isAgent && (
            <div className="flex items-center gap-1">
              <Bot size={12} className="text-[#F97316]" />
              <span className="text-[10px] text-[#F97316]">
                Agent #{item.agentTokenId}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs text-[#555555]">
          {formatTimestamp(item.timestamp)}
        </span>
      </div>

      {/* Details + Amount */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#CCCCCC] font-medium">
          {getDetailsText(item)}
        </span>
        <span className="text-sm text-[#E0E0E0] font-medium">
          {formatAmount(item.amount, item.tokenSymbol)}
        </span>
      </div>

      {/* Tx link */}
      {item.transactionId && (
        <div className="flex justify-end">
          <a
            href={`https://sepolia.basescan.org/tx/${item.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#555555] hover:text-[#F97316] transition-colors"
          >
            View Tx <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  );
}
