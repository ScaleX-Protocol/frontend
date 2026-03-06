'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import { useQueryClient } from '@tanstack/react-query';
import { usePredictionMarkets } from '../hooks/usePredictionMarkets';
import { useMarketPositions } from '../hooks/useMarketPositions';
import { MarketStatus } from '../types/prediction.types';
import StatusFilter from './StatusFilter';
import MarketCard from './MarketCard';
import MarketDetail, { MarketDetailPlaceholder } from './MarketDetail';
import PositionsTable from './PositionsTable';

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

type PositionFilter = 'all' | 'mine';

export default function PredictionsContent() {
  const wallet = useWalletState();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const chainId = ChainConfig.defaultChainId;
  const userAddress = wallet.embeddedWallet.address;

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'positions'>('markets');
  const [statusFilter, setStatusFilter] = useState<MarketStatus | undefined>(
    MarketStatus.Open
  );
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');

  const { data: marketsData, isLoading: marketsLoading } = usePredictionMarkets({
    chainId,
    status: statusFilter,
    limit: 50,
  });

  const markets = marketsData?.markets ?? [];

  // Auto-select first market when markets load and none is selected
  useEffect(() => {
    if (markets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(markets[0].marketId);
    }
  }, [markets, selectedMarketId]);

  // Fetch positions for selected market (all users or filtered)
  const { data: marketPositionsData, isLoading: positionsLoading } = useMarketPositions({
    marketId: selectedMarketId,
    chainId,
    userAddress: positionFilter === 'mine' ? userAddress : undefined,
  });

  const positions = marketPositionsData?.positions ?? [];
  const selectedMarket = markets.find(m => m.marketId === selectedMarketId) ?? null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['predictionMarkets'] });
    queryClient.invalidateQueries({ queryKey: ['marketPositions'] });
  };

  const toggleMarket = (marketId: string) => {
    setSelectedMarketId(marketId === selectedMarketId ? null : marketId);
  };

  const positionsHeader = (
    <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
      <div className="flex items-center gap-3">
        <span className="text-[#FFFFFF] text-[16px] font-semibold">
          Positions
        </span>
        {selectedMarket && (
          <span className="text-[#606060] text-sm">
            Market #{selectedMarketId}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Position filter toggle */}
        <div className="flex rounded-[8px] border border-[#222222] overflow-hidden">
          {(['all', 'mine'] as const).map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => setPositionFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                positionFilter === filter
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#606060] hover:text-[#909090]'
              }`}
            >
              {filter === 'all' ? 'All Users' : 'My Positions'}
            </button>
          ))}
        </div>
        <span className="text-[#606060] text-sm">{positions.length} position(s)</span>
      </div>
    </div>
  );

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
                  onClick={() => toggleMarket(m.marketId)}
                />
              ))
            )}
            {selectedMarket && (
              <MarketDetail market={selectedMarket} />
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] overflow-hidden">
            {positionsHeader}
            <div className="px-4 pb-4">
              {!selectedMarketId ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <TrendingUp size={24} className="text-[#404040]" />
                  <p className="text-[#606060] text-sm">Select a market to view positions</p>
                </div>
              ) : (
                <PositionsTable
                  positions={positions}
                  markets={markets}
                  isLoading={positionsLoading}
                  showUserAddress
                  currentUserAddress={userAddress}
                />
              )}
            </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
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
                  onClick={() => toggleMarket(m.marketId)}
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
            <MarketDetailPlaceholder />
          )}
        </div>
      </div>

      {/* Bottom: Market Positions */}
      <div className="bg-[#0C0C0C] rounded-[24px] border border-[#1F1F1F] overflow-hidden">
        {positionsHeader}
        <div className="px-6 pb-4">
          {!selectedMarketId ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <TrendingUp size={24} className="text-[#404040]" />
              <p className="text-[#606060] text-sm">Select a market to view positions</p>
            </div>
          ) : (
            <PositionsTable
              positions={positions}
              markets={markets}
              isLoading={positionsLoading}
              showUserAddress
              currentUserAddress={userAddress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
