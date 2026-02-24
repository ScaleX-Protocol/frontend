'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, getAddress } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { Contracts } from '@/configs/contracts';
import { ChainTypeConfig } from '@/configs/chainType';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Contract addresses from centralized config (EVM only)
const BALANCE_MANAGER_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  84532: Contracts[84532]?.balanceManagerAddress
};

interface UseTokenApprovalOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface ApprovalParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
}

export function useTokenApproval({ onSuccess, onError }: UseTokenApprovalOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const logger = useLogger();

  const { writeContract, data: hash } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setIsPending(false);
        setError(null);
        onSuccess?.(hash);
      },
      onError: (error) => {
        setIsPending(false);
        setError(error);
        onError?.(error);
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  });

  const approve = async ({ tokenAddress, amount, decimals }: ApprovalParams) => {
    // EVM-only: skip approval in Solana mode
    if (!ChainTypeConfig.isEVM) {
      throw new Error('Token approval is only supported on EVM chains');
    }

    try {
      setIsPending(true);
      setError(null);

      // Convert amount to wei format
      const amountInWei = parseUnits(amount, decimals);

      // Get the BalanceManager contract address (this is who we're approving)
      const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[84532];
      if (!balanceManagerAddress) {
        throw new Error('BalanceManager contract not found');
      }

      // Properly checksum the token address
      const checksumTokenAddress = getAddress(tokenAddress);
      logger.log(LogLevel.INFO, 'Checksum token address for approval', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        tokenAddress: checksumTokenAddress,
        amount,
        decimals
      }, 'useTokenApproval.ts', 'approve');

      // Standard ERC20 ABI for approval
      const erc20Abi = [
        {
          type: 'function',
          name: 'approve',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ];

      writeContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [
          balanceManagerAddress as `0x${string}`, // Spender (BalanceManager)
          amountInWei, // Amount to approve
        ],
        chainId: 84532,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Approval failed');
      setIsPending(false);
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  return {
    approve,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook to check current allowance
export function useTokenAllowance(tokenAddress: string, ownerAddress: string | undefined) {
  const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[84532];

  // Properly checksum the token address if provided
  const checksumTokenAddress = tokenAddress ? getAddress(tokenAddress) : undefined;

  return useReadContract({
    address: checksumTokenAddress,
    abi: [
      {
        type: 'function',
        name: 'allowance',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'allowance',
    args: [
      ownerAddress as `0x${string}`,
      balanceManagerAddress as `0x${string}`,
    ],
    chainId: 84532,
    query: {
      enabled: ChainTypeConfig.isEVM && !!(ownerAddress && balanceManagerAddress && checksumTokenAddress),
    },
  });
}