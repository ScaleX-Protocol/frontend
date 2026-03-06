import { Clock, CheckCircle, Bot } from 'lucide-react';
import type { PendingMarket, ClaimablePosition } from '../../types/pending.types';

interface PendingActionsTableProps {
  awaitingSettlement: PendingMarket[];
  claimable: ClaimablePosition[];
}

function formatTimeElapsed(timestamp: number | null): string {
  if (!timestamp) return 'Pending';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

function formatStrikePrice(price: string): string {
  const num = Number(price) / 1e8;
  return num >= 1 ? `$${num.toLocaleString()}` : `$${num}`;
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function PendingActionsTable({ awaitingSettlement, claimable }: PendingActionsTableProps) {
  const totalCount = awaitingSettlement.length + claimable.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-6 text-[#606060] text-sm">
        No pending actions
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className="text-[#F97316] text-sm font-semibold">{totalCount} action{totalCount !== 1 ? 's' : ''} needed</span>
      </div>

      {/* Awaiting Settlement */}
      {awaitingSettlement.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[#808080] text-xs font-medium uppercase tracking-wide">Awaiting Settlement</span>
          {awaitingSettlement.map((market) => (
            <div key={`await-${market.marketId}-${market.chainId}`} className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[#E0E0E0] text-sm font-medium">
                    Market #{market.marketId}
                    {market.baseTokenSymbol && <span className="text-[#808080] ml-1.5">({market.baseTokenSymbol})</span>}
                  </span>
                  <span className="text-[#606060] text-xs">
                    Strike: {formatStrikePrice(market.strikePrice)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {market.isAgentPosition && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#F97316]/10 text-[#F97316]">
                    <Bot size={10} />
                    Agent
                  </span>
                )}
                <div className="flex items-center gap-1 text-yellow-500 text-xs">
                  <Clock size={12} />
                  <span>{formatTimeElapsed(market.settlementRequestedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claimable */}
      {claimable.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[#808080] text-xs font-medium uppercase tracking-wide">Claim Available</span>
          {claimable.map((position) => (
            <div key={`claim-${position.marketId}-${position.chainId}`} className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex flex-col">
                  <span className="text-[#E0E0E0] text-sm font-medium">
                    Market #{position.marketId}
                    {position.baseTokenSymbol && <span className="text-[#808080] ml-1.5">({position.baseTokenSymbol})</span>}
                  </span>
                  <span className="text-[#606060] text-xs">
                    Strike: {formatStrikePrice(position.strikePrice)} &middot; Outcome: {position.outcome ? 'Up' : 'Down'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {position.isAgentPosition && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#F97316]/10 text-[#F97316]">
                    <Bot size={10} />
                    Agent
                  </span>
                )}
                {position.payout && (
                  <span className="text-green-400 text-sm font-medium">
                    <CheckCircle size={12} className="inline mr-1" />
                    Claimable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
