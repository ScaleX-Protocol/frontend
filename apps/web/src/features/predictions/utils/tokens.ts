import { MarketType } from '../types/prediction.types';

export interface TokenInfo {
  symbol: string;
  decimals: number;
}

// Known prediction market base tokens on Base Sepolia
export const TOKEN_MAP: Record<string, TokenInfo> = {
  '0xb1adfcdbfa28e8aa898acfdc8ac8d59d37fb58f7': { symbol: 'sxWETH', decimals: 18 },
  '0x517044bef2c95cf162068ee46c7e783be8c3a8ad': { symbol: 'sxWETH', decimals: 18 },
};

export const COLLATERAL_SYMBOL = 'IDRX';
export const COLLATERAL_DECIMALS = 6;

export function resolveToken(address: string): TokenInfo {
  const normalized = address.toLowerCase();
  return TOKEN_MAP[normalized] ?? { symbol: shortenAddress(address), decimals: 18 };
}

export function formatAmount(raw: string, decimals = COLLATERAL_DECIMALS): string {
  const n = Number(raw) / Math.pow(10, decimals);
  if (n === 0) return '0';
  if (n < 0.01) return n.toFixed(4);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTimeLeft(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTime - now;
  if (diff <= 0) return 'Ended';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  return `${Math.floor(diff / 86400)}d`;
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getMarketTypeLabel(marketType: MarketType): { up: string; down: string; label: string } {
  if (marketType === MarketType.Absolute) {
    return { up: 'ABOVE', down: 'BELOW', label: 'Above / Below' };
  }
  return { up: 'UP', down: 'DOWN', label: 'UP / DOWN' };
}

export function computePoolPcts(totalUp: string, totalDown: string): { upPct: number; downPct: number; totalPool: bigint } {
  const totalPool = BigInt(totalUp) + BigInt(totalDown);
  const upPct = totalPool > 0n
    ? Math.round((Number(BigInt(totalUp)) / Number(totalPool)) * 100)
    : 50;
  return { upPct, downPct: 100 - upPct, totalPool };
}
