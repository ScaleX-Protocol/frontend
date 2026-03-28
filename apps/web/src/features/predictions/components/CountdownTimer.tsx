import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { MarketStatus } from '../types/prediction.types';

interface CountdownTimerProps {
  endTime: number;
  status: MarketStatus;
  compact?: boolean;
}

function getTimeRemaining(endTime: number) {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTime - now;
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    total: diff,
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

function formatCountdown(t: ReturnType<typeof getTimeRemaining>): string {
  if (t.total <= 0) return 'Ended';
  if (t.days > 0) return `${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m`;
  if (t.minutes > 0) return `${t.minutes}m ${t.seconds}s`;
  return `${t.seconds}s`;
}

function getUrgencyColor(total: number): string {
  if (total <= 0) return 'text-[#606060]';
  if (total < 600) return 'text-[#F44336]';   // < 10 min
  if (total < 3600) return 'text-[#FF9800]';  // < 1 hour
  return 'text-[#4CAF50]';                     // > 1 hour
}

export default function CountdownTimer({ endTime, status, compact = false }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeRemaining(endTime));

  useEffect(() => {
    if (status !== MarketStatus.Open) return;
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  // Terminal statuses
  if (status === MarketStatus.Settled) {
    return (
      <span className="text-[#606060] text-xs font-medium">Settled</span>
    );
  }
  if (status === MarketStatus.Cancelled) {
    return (
      <span className="text-[#F44336] text-xs font-medium">Cancelled</span>
    );
  }
  if (status === MarketStatus.SettlementRequested) {
    return (
      <span className="text-[#FF9800] text-xs font-medium animate-pulse">Settling...</span>
    );
  }

  const colorClass = getUrgencyColor(time.total);

  if (compact) {
    return (
      <span className={`${colorClass} text-xs font-medium flex items-center gap-1`}>
        <Clock size={11} />
        {formatCountdown(time)}
      </span>
    );
  }

  return (
    <div className={`${colorClass} font-semibold text-[14px]`}>
      {formatCountdown(time)}
    </div>
  );
}
