import { TokenIcon } from '@/components/common/TokenIcon';
import { MarketStatus, type PredictionMarket } from '../types/prediction.types';
import { formatAmount, getMarketTypeLabel, computePoolPcts, COLLATERAL_SYMBOL } from '../utils/tokens';
import { useTokenMap } from '../hooks/useTokenMap';
import CountdownTimer from './CountdownTimer';

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

interface MarketCardProps {
  market: PredictionMarket;
  isSelected: boolean;
  onClick: () => void;
}

export default function MarketCard({ market, isSelected, onClick }: MarketCardProps) {
  const resolveToken = useTokenMap();
  const token = resolveToken(market.baseToken);
  const labels = getMarketTypeLabel(market.marketType);
  const { upPct, downPct, totalPool } = computePoolPcts(market.totalUp, market.totalDown);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-[16px] border transition-all ${
        isSelected
          ? 'border-[#F06718]/50 bg-[#F06718]/5'
          : 'border-[#1F1F1F] bg-[#0C0C0C] hover:border-[#333333] hover:bg-[#0E0E0E]'
      }`}
    >
      {/* Header: Token + type + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <TokenIcon symbol={token.symbol} size="sm" />
          <div>
            <span className="text-[#E0E0E0] text-sm font-semibold">
              {token.symbol} / {COLLATERAL_SYMBOL}
            </span>
            <span className="text-[10px] text-[#606060] ml-2">
              {labels.label}
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[market.status]}`}>
          {STATUS_LABEL[market.status]}
        </span>
      </div>

      {/* Pool bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-[#4CAF50] font-medium">{labels.up} {upPct}%</span>
          <span className="text-[#F44336] font-medium">{labels.down} {downPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#4CAF50] rounded-l-full transition-all duration-500"
            style={{ width: `${upPct}%` }}
          />
          <div
            className="h-full bg-[#F44336] rounded-r-full flex-1"
          />
        </div>
      </div>

      {/* Footer: Pool size + countdown */}
      <div className="flex items-center justify-between">
        <span className="text-[#606060] text-[12px]">
          Pool: {formatAmount(totalPool.toString())} {COLLATERAL_SYMBOL}
        </span>
        <CountdownTimer endTime={market.endTime} status={market.status} compact />
      </div>

      {/* Settled outcome */}
      {market.status === MarketStatus.Settled && market.outcome !== null && (
        <div className={`mt-2 text-[11px] font-semibold px-2 py-1 rounded-md text-center ${
          market.outcome
            ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
            : 'bg-[#F44336]/10 text-[#F44336]'
        }`}>
          {market.outcome ? `${labels.up} Won` : `${labels.down} Won`}
        </div>
      )}
    </button>
  );
}
