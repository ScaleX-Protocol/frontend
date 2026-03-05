import { TrendingUp } from 'lucide-react';
import { TokenIcon } from '@/components/common/TokenIcon';
import { MarketStatus, MarketType, type PredictionMarket } from '../types/prediction.types';
import { resolveToken, formatAmount, getMarketTypeLabel, computePoolPcts, COLLATERAL_SYMBOL } from '../utils/tokens';
import PoolChart from './PoolChart';
import CountdownTimer from './CountdownTimer';
import PredictForm from './PredictForm';
import MarketEventsSection from './MarketEventsSection';

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

interface MarketDetailProps {
  market: PredictionMarket;
}

export default function MarketDetail({ market }: MarketDetailProps) {
  const token = resolveToken(market.baseToken);
  const labels = getMarketTypeLabel(market.marketType);
  const { upPct, downPct, totalPool } = computePoolPcts(market.totalUp, market.totalDown);

  return (
    <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[#1F1F1F]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={token.symbol} size="md" />
            <div>
              <h2 className="text-[#E0E0E0] text-[16px] font-semibold">
                {token.symbol} / {COLLATERAL_SYMBOL}
              </h2>
              <p className="text-[#606060] text-[11px] mt-0.5">
                {labels.label} · Market #{market.marketId}
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[market.status]}`}>
            {STATUS_LABEL[market.status]}
          </span>
        </div>
      </div>

      {/* Stats + Chart */}
      <div className="p-5 flex flex-col gap-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] rounded-[12px] p-3">
            <p className="text-[#606060] text-[10px] uppercase tracking-wide mb-1">Total Pool</p>
            <p className="text-[#E0E0E0] text-[14px] font-semibold">
              {formatAmount(totalPool.toString())} {COLLATERAL_SYMBOL}
            </p>
          </div>
          <div className="bg-[#111111] rounded-[12px] p-3">
            <p className="text-[#606060] text-[10px] uppercase tracking-wide mb-1">Ends</p>
            <CountdownTimer endTime={market.endTime} status={market.status} />
          </div>
        </div>

        {/* Pool donut chart */}
        <PoolChart upPct={upPct} downPct={downPct} size={110} />

        {/* Settlement outcome */}
        {market.status === MarketStatus.Settled && market.outcome !== null && (
          <div className={`rounded-[12px] p-3 text-center font-semibold text-[14px] ${
            market.outcome
              ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
              : 'bg-[#F44336]/10 text-[#F44336]'
          }`}>
            {market.outcome ? `${labels.up} Won` : `${labels.down} Won`}
          </div>
        )}

        {/* TWAP / Strike Price */}
        <div className="flex flex-col gap-2 border-t border-[#1F1F1F] pt-4">
          {market.openingTwap !== '0' && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#606060]">Opening TWAP</span>
              <span className="text-[#A0A0A0] font-mono text-[11px]">{market.openingTwap}</span>
            </div>
          )}
          {market.marketType === MarketType.Absolute && market.strikePrice !== '0' && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#606060]">Strike Price</span>
              <span className="text-[#A0A0A0] font-mono text-[11px]">{market.strikePrice}</span>
            </div>
          )}
        </div>

        {/* Predict Form */}
        <div className="border-t border-[#1F1F1F] pt-4">
          <h3 className="text-[#E0E0E0] text-[13px] font-semibold mb-3">Place Prediction</h3>
          <PredictForm market={market} />
        </div>

        {/* Activity Feed */}
        <div className="border-t border-[#1F1F1F] pt-4">
          <h3 className="text-[#E0E0E0] text-[13px] font-semibold mb-3">Recent Activity</h3>
          <MarketEventsSection marketId={market.marketId} />
        </div>
      </div>
    </div>
  );
}

// Placeholder when no market is selected
export function MarketDetailPlaceholder() {
  return (
    <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
      <TrendingUp size={32} className="text-[#303030]" />
      <p className="text-[#404040] text-sm">Select a market to view details</p>
    </div>
  );
}
