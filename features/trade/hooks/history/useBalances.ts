import { useQuery } from '@tanstack/react-query';
import { fetchBalances } from '../../mockAPI/history.mockAPI';

export const useBalances = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: fetchBalances,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
