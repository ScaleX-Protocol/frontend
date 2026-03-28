const UINT256_MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const UINT128_MAX = '340282366920938463463374607431768211455';

export function formatTokenAmount(value: string, decimals: number = 6): string {
  if (!value || value === '0') return '0';

  // Handle decimal strings from analytics API (e.g. "0.000000")
  const sanitized = value.includes('.') ? value.split('.')[0] || '0' : value;
  if (sanitized === '0') return '0';

  const num = BigInt(sanitized);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const remainder = num % divisor;

  if (remainder === 0n) {
    return whole.toLocaleString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toLocaleString()}.${remainderStr}`;
}

export function formatBigIntMax(value: string): string {
  if (value === UINT256_MAX || value === UINT128_MAX) {
    return 'Unlimited';
  }
  return value;
}

export function formatBps(value: string): string {
  const bps = Number(value);
  if (bps === 0) return 'No limit';
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export function formatHealthFactor(value: string): string {
  if (!value || value === '0') return 'No limit';
  const hf = Number(BigInt(value) * 100n / BigInt(1e18));
  return `${hf}%`;
}

export function formatTimestamp(unix: number): string {
  if (!unix) return 'N/A';
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(unix: number): string {
  if (!unix) return 'Never';
  const now = Date.now();
  const diff = now - unix * 1000;

  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 2592000_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return formatTimestamp(unix);
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
