import { RefreshCw, Users } from 'lucide-react';
import { MarketStatus, type PredictionMarket, type PredictionPosition } from '../types/prediction.types';
import { formatAmount, COLLATERAL_SYMBOL, shortenAddress } from '../utils/tokens';

const STATUS_LABEL: Record<MarketStatus, string> = {
  [MarketStatus.Open]: 'Open',
  [MarketStatus.SettlementRequested]: 'Settling',
  [MarketStatus.Settled]: 'Settled',
  [MarketStatus.Cancelled]: 'Cancelled',
};

const STATUS_STYLE: Record<MarketStatus, string> = {
  [MarketStatus.Open]: 'text-[#4CAF50] bg-[#4CAF50]/10',
  [MarketStatus.SettlementRequested]: 'text-[#FF9800] bg-[#FF9800]/10',
  [MarketStatus.Settled]: 'text-[#64B5F6] bg-[#64B5F6]/10',
  [MarketStatus.Cancelled]: 'text-[#F44336] bg-[#F44336]/10',
};

interface PositionsTableProps {
  positions: PredictionPosition[];
  markets: PredictionMarket[];
  isLoading: boolean;
  showUserAddress?: boolean;
  currentUserAddress?: string;
}

export default function PositionsTable({
  positions,
  markets,
  isLoading,
  showUserAddress = false,
  currentUserAddress,
}: PositionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <RefreshCw size={20} className="text-[#404040] animate-spin" />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Users size={24} className="text-[#404040]" />
        <p className="text-[#606060] text-sm">No positions yet</p>
      </div>
    );
  }

  const marketMap = new Map(markets.map(m => [m.marketId, m]));

  return (
    <div className="flex flex-col divide-y divide-[#1A1A1A]">
      {positions.map(pos => {
        const market = marketMap.get(pos.marketId);
        const isSettled = market?.status === MarketStatus.Settled;
        const isClaimed = pos.claimed;
        const isCurrentUser =
          currentUserAddress &&
          pos.userAddress.toLowerCase() === currentUserAddress.toLowerCase();

        const stakeUp = BigInt(pos.stakeUp);
        const stakeDown = BigInt(pos.stakeDown);

        return (
          <div key={pos.id} className="py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {showUserAddress ? (
                  <span className="text-[#E0E0E0] text-sm font-medium font-mono">
                    {shortenAddress(pos.userAddress)}
                  </span>
                ) : (
                  <span className="text-[#E0E0E0] text-sm font-medium">
                    Market #{pos.marketId}
                  </span>
                )}
                {showUserAddress && isCurrentUser && (
                  <span className="text-[10px] text-[#4CAF50] bg-[#4CAF50]/10 px-1.5 py-0.5 rounded font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {!showUserAddress && (
                  <span className="text-[#505050] font-mono text-[10px]">
                    {shortenAddress(pos.userAddress)}
                  </span>
                )}
                {stakeUp > 0n && (
                  <span className="text-[#4CAF50]">
                    UP {formatAmount(stakeUp.toString())} {COLLATERAL_SYMBOL}
                  </span>
                )}
                {stakeDown > 0n && (
                  <span className="text-[#F44336]">
                    DOWN {formatAmount(stakeDown.toString())} {COLLATERAL_SYMBOL}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {isClaimed && pos.payout !== null && (
                <span className="text-[#4CAF50] text-[12px] font-medium">
                  +{formatAmount(pos.payout)} {COLLATERAL_SYMBOL} claimed
                </span>
              )}
              {!isClaimed && isSettled && (
                <span className="text-[11px] text-[#FF9800] bg-[#FF9800]/10 px-2 py-0.5 rounded font-medium">
                  Claimable
                </span>
              )}
              {!isSettled && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded ${
                    market ? STATUS_STYLE[market.status] : 'text-[#606060]'
                  }`}
                >
                  {market ? STATUS_LABEL[market.status] : 'Unknown'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
