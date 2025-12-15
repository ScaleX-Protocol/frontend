import { useReadContract, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { Contracts } from '@/configs/contracts';

const BALANCE_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'currency',
        type: 'address',
      },
    ],
    name: 'getAvailableBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface UseContractBalanceParams {
  userAddress?: `0x${string}`;
  currencyAddress?: `0x${string}`;
  decimals?: number;
  enabled?: boolean;
}

export function useContractBalance({
  userAddress,
  currencyAddress,
  decimals = 18,
  enabled = true,
}: UseContractBalanceParams) {
  const chainId = useChainId();
  const balanceManagerAddress = Contracts[chainId]?.balanceManagerAddress;

  const { data: rawBalance, isLoading, refetch } = useReadContract({
    address: balanceManagerAddress,
    abi: BALANCE_MANAGER_ABI,
    functionName: 'getAvailableBalance',
    args: userAddress && currencyAddress ? [userAddress, currencyAddress] : undefined,
    query: {
      enabled: enabled && !!userAddress && !!currencyAddress && !!balanceManagerAddress,
      refetchInterval: 5000, // Refetch every 5 seconds to get updated yield
    },
  });

  const formattedBalance = rawBalance
    ? parseFloat(formatUnits(rawBalance, decimals))
    : 0;

  return {
    rawBalance,
    formattedBalance,
    formattedString: formattedBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }),
    isLoading,
    refetch,
  };
}
