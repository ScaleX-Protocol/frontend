"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { ActivityItem } from "../../types/activity.types";
import { ExternalLink, Bot } from "lucide-react";

const columnHelper = createColumnHelper<ActivityItem>();

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
  const formatted =
    num >= 1e9
      ? `${(num / 1e9).toFixed(2)}B`
      : num >= 1e6
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
      if (item.subtype === "circuit_breaker") return `Circuit breaker triggered`;
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

export const activityColumns = [
  columnHelper.accessor("timestamp", {
    header: "TIME",
    cell: (info) => (
      <span className="text-[#A0A0A0]">{formatTimestamp(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "TYPE",
    cell: (info) => {
      const type = info.getValue();
      const isAgent = info.row.original.isAgent;
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
              TYPE_COLORS[type] || TYPE_COLORS.trading
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          {isAgent && (
            <Bot size={12} className="text-[#F97316]" />
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "details",
    header: "DETAILS",
    cell: (info) => (
      <span className="text-[#CCCCCC]">{getDetailsText(info.row.original)}</span>
    ),
  }),
  columnHelper.accessor("amount", {
    header: "AMOUNT",
    meta: { align: "right" },
    cell: (info) => (
      <span className="text-[#E0E0E0]">
        {formatAmount(info.getValue(), info.row.original.tokenSymbol)}
      </span>
    ),
  }),
  columnHelper.accessor("transactionId", {
    header: "TX",
    meta: { align: "right" },
    cell: (info) => {
      const txId = info.getValue();
      if (!txId) return <span className="text-[#555555]">-</span>;
      return (
        <a
          href={`https://sepolia.basescan.org/tx/${txId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#555555] hover:text-[#F97316] transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      );
    },
  }),
];
