import { useQuery } from '@tanstack/react-query';
import { fetchOpenOrders } from '../../mockAPI/history.mockAPI';

export const useOpenOrders = () => {
  return useQuery({
    queryKey: ['openOrders'],
    queryFn: fetchOpenOrders,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};
