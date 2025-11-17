import { mockApi } from '../mockAPI/faucet.mockAPI';
import { useQuery } from '@tanstack/react-query';
import type { HexAddress } from '../types/faucet.types';

export const useUserAndFaucetBalances = (
  userAddress: HexAddress | undefined,
  faucetAddress: HexAddress,
  tokenAddress: HexAddress | undefined,
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['balances', userAddress, faucetAddress, tokenAddress],
    queryFn: async () => {
      if (!userAddress || !tokenAddress) return null;

      const [userBalanceRes, faucetBalanceRes] = await Promise.all([
        mockApi.getUserBalance(userAddress, tokenAddress),
        mockApi.getFaucetBalance(faucetAddress, tokenAddress),
      ]);

      return {
        userBalance: userBalanceRes.balance,
        faucetBalance: faucetBalanceRes.balance,
      };
    },
    enabled: !!userAddress && !!tokenAddress,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    userBalance: data?.userBalance,
    faucetBalance: data?.faucetBalance,
    loading: isLoading,
    error,
    refetch,
  };
};
