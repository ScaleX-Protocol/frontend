'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Users, RefreshCw } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import { useQueryClient } from '@tanstack/react-query';
import { usePredictionMarkets } from '../hooks/usePredictionMarkets';
import { useUserPositions } from '../hooks/useUserPositions';
import { MarketStatus, MarketType, type PredictionMarket, type PredictionPosition } from '../types/prediction.types';

const MARKET_TYPE_LABEL: Record<MarketType, string> = {
  [MarketType.Directional]: 'UP / DOWN',
  [MarketType.Absolute]: 'Above / Below',
};

const STATUS_LABEL: Record<MarketStatus, string> = {
  [MarketStatus.Open]: 'Open',
  [MarketStatus.SettlementRequested]: 'Settling',
  [MarketStatus.Settled]: 'Settled',
  [MarketStatus.Cancelled]: 'Cancelled',
};

const STATUS_COLOR: Record<MarketStatus, string> = {
  [MarketStatus.Open]: 'text-[#4CAF50] bg-[#4CAF50]/10',
  [MarketStatus.SettlementRequested]: 'text-[#FF9800] bg-[#FF9800]/10',
  [MarketStatus.Settled]: 'text-[#606060] bg-[#1F1F1F]',
  [MarketStatus.Cancelled]: 'text-[#F44336] bg-[#F44336]/10',
};

function formatAmount(raw: string, decimals = 6): string {
  const n = Number(raw) / Math.pow(10, decimals);
  if (n === 0) return '0';
  if (n < 0.01) return n.toFixed(4);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimeLeft(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTime - now;
  if (diff <= 0) return 'Ended';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  return `${Math.floor(diff / 86400)}d`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ─── Market Card ─────────────────────────────────────────────────────────────

function MarketCard({
  market,
  isSelected,
  onClick,
}: {
  market: PredictionMarket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const totalPool = BigInt(market.totalUp) + BigInt(market.totalDown);
  const upPct =
    totalPool > 0n
      ? Math.round((Number(BigInt(market.totalUp)) / Number(totalPool)) * 100)
      : 50;
  const downPct = 100 - upPct;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-[16px] border transition-all ${
        isSelected
          ? 'border-[#F06718] bg-[#F06718]/5'
          : 'border-[#1F1F1F] bg-[#0C0C0C] hover:border-[#333333]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#E0E0E0] text-sm font-semibold">
            {shortenAddress(market.baseToken)} / IDRX
          </span>
          <span className="text-[10px] text-[#808080] bg-[#1A1A1A] px-1.5 py-0.5 rounded">
            {MARKET_TYPE_LABEL[market.marketType]}
          </span>
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            STATUS_COLOR[market.status]
          }`}
        >
          {STATUS_LABEL[market.status]}
        </span>
      </div>

      {/* Pool bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-[#4CAF50] font-medium">UP {upPct}%</span>
          <span className="text-[#F44336] font-medium">DOWN {downPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F44336]/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4CAF50]"
            style={{ width: `${upPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-[12px] text-[#606060]">
        <span>Pool: {formatAmount(totalPool.toString())} IDRX</span>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{formatTimeLeft(market.endTime)}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Market Detail ────────────────────────────────────────────────────────────

function MarketDetail({ market }: { market: PredictionMarket }) {
  const totalPool = BigInt(market.totalUp) + BigInt(market.totalDown);
  const upPct =
    totalPool > 0n
      ? Math.round((Number(BigInt(market.totalUp)) / Number(totalPool)) * 100)
      : 50;
  const downPct = 100 - upPct;

  return (
    <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#E0E0E0] text-[16px] font-semibold">
            {shortenAddress(market.baseToken)} / IDRX
          </h2>
          <p className="text-[#606060] text-[12px] mt-0.5">
            {MARKET_TYPE_LABEL[market.marketType]} · Market #{market.marketId}
          </p>
        </div>
        <span
          className={`text-[12px] font-medium px-3 py-1 rounded-full ${
            STATUS_COLOR[market.status]
          }`}
        >
          {STATUS_LABEL[market.status]}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111111] rounded-[12px] p-3">
          <p className="text-[#606060] text-[11px] mb-1">Total Pool</p>
          <p className="text-[#E0E0E0] text-[14px] font-semibold">
            {formatAmount(totalPool.toString())} IDRX
          </p>
        </div>
        <div className="bg-[#111111] rounded-[12px] p-3">
          <p className="text-[#606060] text-[11px] mb-1">Ends</p>
          <p className="text-[#E0E0E0] text-[14px] font-semibold">
            {formatTimeLeft(market.endTime)}
          </p>
        </div>
        <div className="bg-[#111111] rounded-[12px] p-3">
          <p className="text-[#606060] text-[11px] mb-1">UP Pool</p>
          <p className="text-[#4CAF50] text-[14px] font-semibold">
            {formatAmount(market.totalUp)} ({upPct}%)
          </p>
        </div>
        <div className="bg-[#111111] rounded-[12px] p-3">
          <p className="text-[#606060] text-[11px] mb-1">DOWN Pool</p>
          <p className="text-[#F44336] text-[14px] font-semibold">
            {formatAmount(market.totalDown)} ({downPct}%)
          </p>
        </div>
      </div>

      {/* Pool bar */}
      <div>
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="text-[#4CAF50] font-medium flex items-center gap-1">
            <TrendingUp size={13} /> UP {upPct}%
          </span>
          <span className="text-[#F44336] font-medium flex items-center gap-1">
            DOWN {downPct}% <TrendingDown size={13} />
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#F44336]/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4CAF50]"
            style={{ width: `${upPct}%` }}
          />
        </div>
      </div>

      {/* Settlement outcome */}
      {market.status === MarketStatus.Settled && market.outcome !== null && (
        <div
          className={`rounded-[12px] p-3 text-center ${
            market.outcome
              ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
              : 'bg-[#F44336]/10 text-[#F44336]'
          }`}
        >
          <span className="font-semibold text-[14px]">
            {market.outcome ? '↑ UP Won' : '↓ DOWN Won'}
          </span>
        </div>
      )}

      {/* Opening TWAP */}
      {market.openingTwap !== '0' && (
        <div className="text-[12px] text-[#606060] flex items-center justify-between border-t border-[#1F1F1F] pt-3">
          <span>Opening TWAP</span>
          <span className="text-[#A0A0A0]">{market.openingTwap}</span>
        </div>
      )}
      {market.marketType === MarketType.Absolute && market.strikePrice !== '0' && (
        <div className="text-[12px] text-[#606060] flex items-center justify-between -mt-2">
          <span>Strike Price</span>
          <span className="text-[#A0A0A0]">{market.strikePrice}</span>
        </div>
      )}
    </div>
  );
}

// ─── Positions Table ──────────────────────────────────────────────────────────

function PositionsTable({
  positions,
  markets,
  isLoading,
}: {
  positions: PredictionPosition[];
  markets: PredictionMarket[];
  isLoading: boolean;
}) {
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

        const stakeUp = BigInt(pos.stakeUp);
        const stakeDown = BigInt(pos.stakeDown);
        const totalStake = stakeUp + stakeDown;

        return (
          <div key={pos.id} className="py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#E0E0E0] text-sm font-medium">
                Market #{pos.marketId}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                {stakeUp > 0n && (
                  <span className="text-[#4CAF50]">
                    ↑ {formatAmount(stakeUp.toString())} IDRX
                  </span>
                )}
                {stakeDown > 0n && (
                  <span className="text-[#F44336]">
                    ↓ {formatAmount(stakeDown.toString())} IDRX
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {isClaimed && pos.payout !== null && (
                <span className="text-[#4CAF50] text-[12px] font-medium">
                  +{formatAmount(pos.payout)} IDRX claimed
                </span>
              )}
              {!isClaimed && isSettled && (
                <span className="text-[11px] text-[#808080] bg-[#1A1A1A] px-2 py-0.5 rounded">
                  Claimable
                </span>
              )}
              {!isSettled && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded ${
                    market ? STATUS_COLOR[market.status] : 'text-[#606060]'
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

// ─── Main Component ───────────────────────────────────────────────────────────

function PredictionsContent() {
  const wallet = useWalletState();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const chainId = ChainConfig.defaultChainId;

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'positions'>('markets');
  const [statusFilter, setStatusFilter] = useState<MarketStatus | undefined>(
    MarketStatus.Open
  );

  const { data: marketsData, isLoading: marketsLoading } = usePredictionMarkets({
    chainId,
    status: statusFilter,
    limit: 50,
  });

  const { data: positionsData, isLoading: positionsLoading } = useUserPositions({
    userAddress: wallet.embeddedWallet.address,
    chainId,
  });

  const markets = marketsData?.markets ?? [];
  const positions = positionsData?.positions ?? [];
  const selectedMarket = markets.find(m => m.marketId === selectedMarketId) ?? null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['predictionMarkets'] });
    queryClient.invalidateQueries({ queryKey: ['predictionPositions'] });
  };

  // ── Mobile Layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="w-full flex-1 flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[#E0E0E0] text-[18px] font-semibold">Predictions</h1>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-[8px] border border-[#222222] text-[#606060] hover:text-[#A0A0A0] transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#222222]">
          {(['markets', 'positions'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition-colors relative capitalize ${
                activeTab === tab ? 'text-white' : 'text-[#666666]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'markets' && (
          <div className="flex flex-col gap-3">
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            {marketsLoading ? (
              <LoadingRows />
            ) : markets.length === 0 ? (
              <EmptyState label="No markets found" />
            ) : (
              markets.map(m => (
                <MarketCard
                  key={m.id}
                  market={m}
                  isSelected={m.marketId === selectedMarketId}
                  onClick={() =>
                    setSelectedMarketId(
                      m.marketId === selectedMarketId ? null : m.marketId
                    )
                  }
                />
              ))
            )}
            {selectedMarket && (
              <MarketDetail market={selectedMarket} />
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] p-4">
            <PositionsTable
              positions={positions}
              markets={markets}
              isLoading={positionsLoading}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Desktop Layout ─────────────────────────────────────────────────────────
  return (
    <div className="w-full flex-1 p-8 flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#E0E0E0] text-[20px] font-semibold">
            Prediction Markets
          </h1>
          <p className="text-[#606060] text-sm mt-0.5">
            Binary UP/DOWN markets settled by Chainlink CRE · Funds earn yield while locked
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm text-[#606060] hover:text-[#A0A0A0] bg-[#111111] border border-[#222222] px-3 py-2 rounded-[8px] transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Main grid: market list + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left: Market List */}
        <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] font-semibold">Markets</span>
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
          <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
            {marketsLoading ? (
              <LoadingRows />
            ) : markets.length === 0 ? (
              <EmptyState label="No markets for this status" />
            ) : (
              markets.map(m => (
                <MarketCard
                  key={m.id}
                  market={m}
                  isSelected={m.marketId === selectedMarketId}
                  onClick={() =>
                    setSelectedMarketId(
                      m.marketId === selectedMarketId ? null : m.marketId
                    )
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Detail or placeholder */}
        <div className="flex flex-col gap-4">
          {selectedMarket ? (
            <MarketDetail market={selectedMarket} />
          ) : (
            <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] p-6 flex items-center justify-center min-h-[200px]">
              <p className="text-[#404040] text-sm">Select a market to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: My Positions */}
      <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[16px] font-semibold">My Positions</span>
          <span className="text-[#606060] text-sm">{positions.length} position(s)</span>
        </div>
        <div className="px-6 pb-4">
          <PositionsTable
            positions={positions}
            markets={markets}
            isLoading={positionsLoading}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Small Helpers ────────────────────────────────────────────────────────────

function StatusFilter({
  value,
  onChange,
}: {
  value: MarketStatus | undefined;
  onChange: (v: MarketStatus | undefined) => void;
}) {
  const options: { label: string; value: MarketStatus | undefined }[] = [
    { label: 'Open', value: MarketStatus.Open },
    { label: 'Settling', value: MarketStatus.SettlementRequested },
    { label: 'Settled', value: MarketStatus.Settled },
    { label: 'All', value: undefined },
  ];

  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-[11px] px-2.5 py-1 rounded-[6px] transition-colors ${
            value === opt.value
              ? 'bg-[#F06718] text-white'
              : 'bg-[#161616] border border-[#222222] text-[#606060] hover:text-[#A0A0A0]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-[96px] rounded-[16px] bg-[#111111] animate-pulse" />
      ))}
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <TrendingUp size={24} className="text-[#303030]" />
      <p className="text-[#505050] text-sm">{label}</p>
    </div>
  );
}

export default function Predictions() {
  return <PredictionsContent />;
}
