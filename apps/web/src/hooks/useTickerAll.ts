import { useQuery } from '@tanstack/react-query';
import type { Ticker24hr } from '@/features/trade/types/chart.types';
import { fetchAPI } from '@/hooks/fetchAPI';

export function useTickerAll() {
  return useQuery<Ticker24hr[]>({
    queryKey: ['tickerAll'],
    queryFn: () => fetchAPI<Ticker24hr[]>('/ticker/24hr/all'),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    structuralSharing: false,
  });
}
