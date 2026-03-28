import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { useAgentAnalytics } from '../hooks/useAgentAnalytics';

interface AgentAnalyticsProps {
  agentTokenId: string;
}

export default function AgentAnalytics({ agentTokenId }: AgentAnalyticsProps) {
  const { data, isLoading, error } = useAgentAnalytics(agentTokenId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`analytics-skeleton-${i}`} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
            <div className="h-3 w-16 bg-[#1A1A1A] rounded mb-2" />
            <div className="h-6 w-20 bg-[#1A1A1A] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 text-center">
        <p className="text-[#606060] text-sm">Analytics data unavailable</p>
      </div>
    );
  }

  const analytics = data.data;
  const pnlNum = parseFloat(analytics.totalPnl || analytics.totalPnL || '0');
  const pnlPositive = pnlNum >= 0;
  const fmtNum = (v: string | number) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const stats = [
    {
      label: 'Total PnL',
      value: `${pnlPositive ? '+' : ''}${fmtNum(analytics.totalPnl || analytics.totalPnL || '0')} IDRX`,
      icon: pnlPositive ? TrendingUp : TrendingDown,
      color: pnlPositive ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Win Rate',
      value: `${((analytics.winRate || 0) * 100).toFixed(1)}%`,
      icon: Target,
      color: (analytics.winRate || 0) >= 0.5 ? 'text-green-400' : 'text-[#E0E0E0]',
    },
    {
      label: 'Fill Rate',
      value: `${((analytics.fillRate || 0) * 100).toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-[#E0E0E0]',
    },
    {
      label: 'Total Volume',
      value: `${fmtNum(analytics.totalVolume || '0')} IDRX`,
      icon: TrendingUp,
      color: 'text-[#E0E0E0]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[#606060] text-xs mb-2">
            <stat.icon size={12} />
            <span>{stat.label}</span>
          </div>
          <p className={`font-semibold text-sm ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
