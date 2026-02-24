import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { Ticker24hr } from '@/features/trade/types/chart.types';

export function useTickerAll() {
  return useQuery<Ticker24hr[]>({
    queryKey: ['tickerAll'],
    queryFn: () => fetchIndexerAPI<Ticker24hr[]>('/ticker/24hr/all'),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    structuralSharing: false,
  });
}
