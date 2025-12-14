import { formatBalance as formatBalanceCore, formatCooldown as formatCooldownCore } from '../../../core/utils';

// Backward compatibility wrapper for formatBalance
export const formatBalance = (balance: string | undefined, decimals: number) => {
  if (!balance) return '-';
  const formatted = formatBalanceCore(balance, decimals, undefined, {
    maxDecimals: 2,
    minDecimals: 2
  });
  // Remove the symbol if present
  return formatted.replace(/\s+\w+$/, '');
};

// Backward compatibility wrapper for formatCooldown
export const formatCooldown = (seconds: number) => {
  if (seconds === 0) return 'Ready';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};
