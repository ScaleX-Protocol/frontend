import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HexAddress } from '../types/faucet.types';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useRequestTokenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userAddress, tokenAddress }: { userAddress: HexAddress; tokenAddress: HexAddress }) =>
      mockApi.requestTokens(userAddress, tokenAddress),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['faucetRequests'] });
      queryClient.invalidateQueries({
        queryKey: ['balances', variables.userAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ['lastRequestTime', variables.userAddress],
      });
    },
  });
};
