import { useQuery } from '@tanstack/react-query';
import { fetchTradeHistory } from '../../mockAPI/history.mockAPI';

export const useTradeHistory = () => {
  return useQuery({
    queryKey: ['tradeHistory'],
    queryFn: fetchTradeHistory,
    staleTime: 60000, // 1 minute
  });
};
