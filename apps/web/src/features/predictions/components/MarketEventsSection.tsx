import { Bot } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { usePredictionEvents } from '../hooks/usePredictionEvents';
import { formatAmount, shortenAddress } from '../utils/tokens';

const EVENT_STYLE: Record<string, { label: string; color: string }> = {
  Predicted: { label: 'PREDICT', color: '' }, // dynamic based on predictedUp
  Claimed: { label: 'CLAIM', color: 'text-[#FF9800]' },
  MarketCreated: { label: 'CREATED', color: 'text-[#808080]' },
  MarketSettled: { label: 'SETTLED', color: 'text-[#64B5F6]' },
  SettlementRequested: { label: 'SETTLING', color: 'text-[#FF9800]' },
  MarketCancelled: { label: 'CANCELLED', color: 'text-[#F44336]' },
};

interface MarketEventsSectionProps {
  marketId: string;
}

export default function MarketEventsSection({ marketId }: MarketEventsSectionProps) {
  const { data, isLoading, error } = usePredictionEvents(marketId, { limit: 20 });
  const events = data?.events ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-[#111111] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-[#606060] text-xs text-center py-3">Failed to load activity</p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-[#606060] text-xs text-center py-3">No activity yet</p>
    );
  }

  return (
    <div className="flex flex-col">
      {events.map((event) => {
        const isPrediction = event.eventType === 'Predicted';
        const style = EVENT_STYLE[event.eventType] ?? { label: event.eventType.toUpperCase(), color: 'text-[#808080]' };
        const colorClass = isPrediction
          ? (event.predictedUp ? 'text-[#4CAF50]' : 'text-[#F44336]')
          : style.color;
        const displayLabel = isPrediction
          ? (event.predictedUp ? 'UP' : 'DOWN')
          : style.label;

        return (
          <div
            key={event.id}
            className="flex items-center justify-between py-2 border-b border-[#1F1F1F]/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase w-[52px] ${colorClass}`}>
                {displayLabel}
              </span>
              {event.userAddress && (
                <span className="text-[#808080] text-[11px]">
                  {shortenAddress(event.userAddress)}
                </span>
              )}
              {event.agentTokenId && (
                <Link
                  to="/agents/$agentTokenId"
                  params={{ agentTokenId: event.agentTokenId }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1A1A2E] border border-[#2A2A4E] text-[9px] text-[#8B8BFF] hover:bg-[#252545] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Bot size={9} />
                  #{event.agentTokenId}
                </Link>
              )}
            </div>
            <span className="text-[#A0A0A0] text-[11px]">
              {event.amount ? `${formatAmount(event.amount)} IDRX` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
