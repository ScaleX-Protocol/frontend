'use client';

import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { HealthFactorProjection } from '@/features/trade/hooks/useHealthFactorProjection';

interface HealthFactorDisplayProps {
  healthFactor: HealthFactorProjection;
  variant?: 'desktop' | 'mobile';
}

export default function HealthFactorDisplay({
  healthFactor,
  variant = 'desktop'
}: HealthFactorDisplayProps) {
  const { current, projected, status, isLoading } = healthFactor;

  // Don't show if data isn't available yet (0 means no data loaded)
  if (current === 0 && !isLoading) {
    return null;
  }

  // Format health factor for display with more precision
  const formatHF = (hf: number): string => {
    if (hf === Infinity) return '∞';
    if (hf === 0) return '0.00';
    return hf.toFixed(2);
  };

  // Get status icon
  const StatusIcon = () => {
    if (status === 'safe') return <ShieldCheck className="w-4 h-4" />;
    if (status === 'warning') return <ShieldAlert className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  // Get status color
  const getStatusColor = () => {
    if (status === 'safe') return '#2ECC71';  // Green
    if (status === 'warning') return '#FFA500';  // Yellow/Orange
    return '#FF6B6B';  // Red
  };

  const statusColor = getStatusColor();

  // Mobile variant - compact badge
  if (variant === 'mobile') {
    return (
      <div
        className="flex items-center gap-2 p-2 rounded-lg border transition-colors duration-300"
        style={{
          backgroundColor: `${statusColor}20`,
          borderColor: `${statusColor}40`
        }}
      >
        <div style={{ color: statusColor }}>
          <StatusIcon />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#999999]">HF:</span>
          <span className="font-medium" style={{ color: statusColor }}>
            {isLoading ? '...' : formatHF(current)}
          </span>
          <span className="text-[#666666]">→</span>
          <span className="font-medium" style={{ color: statusColor }}>
            {isLoading ? '...' : formatHF(projected)}
          </span>
        </div>
      </div>
    );
  }

  // Desktop variant - full display
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border transition-colors duration-300"
      style={{
        backgroundColor: `${statusColor}15`,
        borderColor: `${statusColor}30`
      }}
    >
      <div className="flex items-center gap-2">
        <div style={{ color: statusColor }}>
          <StatusIcon />
        </div>
        <span className="text-sm text-[#E0E0E0]">Health Factor</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {isLoading ? '...' : formatHF(current)}
        </span>
        <span className="text-[#666666]">→</span>
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {isLoading ? '...' : formatHF(projected)}
        </span>
        {status === 'warning' && (
          <span className="text-xs text-[#999999]">⚠️</span>
        )}
      </div>
    </div>
  );
}
