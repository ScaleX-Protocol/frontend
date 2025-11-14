import { formatUnits } from "viem";

export const formatBalance = (balance: string | undefined, decimals: number) => {
  if (!balance) return '-';
  const formatted = formatUnits(BigInt(balance), decimals);
  return Number(formatted).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCooldown = (seconds: number) => {
  if (seconds === 0) return 'Ready';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};
