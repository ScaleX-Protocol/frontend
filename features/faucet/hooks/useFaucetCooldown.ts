import { useQuery } from '@tanstack/react-query';
import type { HexAddress } from '../types/faucet.types';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useFaucetCooldown = (faucetAddress: HexAddress) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faucetCooldown', faucetAddress],
    queryFn: () => mockApi.getFaucetCooldown(faucetAddress),
    staleTime: 10 * 60 * 1000, // 10 minutes (cooldown doesn't change often)
  });

  return {
    faucetCooldown: data?.cooldown,
    loading: isLoading,
    error,
    refetch,
  };
};
