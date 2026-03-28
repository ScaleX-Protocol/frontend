import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { TokenInfo } from '../utils/tokens';
import { shortenAddress } from '../utils/tokens';

interface CurrencyItem {
  address: string;
  symbol: string | null;
  decimals: number | null;
}

interface CurrenciesResponse {
  success: boolean;
  data: {
    items: CurrencyItem[];
  };
}

export function useTokenMap(): (address: string) => TokenInfo {
  const { data } = useQuery<CurrenciesResponse>({
    queryKey: ['currencies'],
    queryFn: () => fetchAPI<CurrenciesResponse>('/api/currencies?limit=200'),
    staleTime: 5 * 60_000,
  });

  const map = useMemo<Record<string, TokenInfo>>(() => {
    const items = data?.data?.items ?? [];
    return Object.fromEntries(
      items
        .filter(c => c.symbol && c.decimals != null)
        .map(c => [c.address.toLowerCase(), { symbol: c.symbol!, decimals: c.decimals! }])
    );
  }, [data]);

  return useCallback(
    (address: string) => map[address.toLowerCase()] ?? { symbol: shortenAddress(address), decimals: 18 },
    [map],
  );
}
