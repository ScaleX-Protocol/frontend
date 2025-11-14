import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useFaucetStats = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faucetStats'],
    queryFn: () => mockApi.getFaucetStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    stats: data,
    loading: isLoading,
    error,
    refetch,
  };
};
