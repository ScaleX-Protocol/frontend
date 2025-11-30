'use client';

import { parseContractError, validateDepositParams } from '@/utils/depositUtils';
import { useState, useCallback, useEffect } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract, useAccount } from 'wagmi';
import { useTokenApproval } from './useTokenApproval';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';
import { usePublicClient } from 'wagmi';

// Contract addresses from centralized config
const BALANCE_MANAGER_ADDRESSES = {
  84532: Contracts[84532].balanceManagerAddress
};

// Minimal logging utility - only essential logs
const logger = {
  info: (message: string) => {
    console.log(`[Deposit] ${message}`);
  },
  success: (message: string) => {
    console.log(`[Deposit] ✓ ${message}`);
  },
  warning: (message: string) => {
    console.warn(`[Deposit] ⚠️ ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`[Deposit] ❌ ${message}`, error);
  },
  debug: () => {
    // Disabled debug logging
  }
};

interface UseDepositOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface DepositParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  recipient?: string;
}

type TokenType = 'ETH' | 'ERC20';
type DepositStep = 'idle' | 'validating' | 'approving' | 'depositing' | 'confirming' | 'completed' | 'error';

export function useDeposit({ onSuccess, onError }: UseDepositOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<DepositStep>('idle');

  // Get current chain ID and public client
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { approve: approveToken } = useTokenApproval();

  // Get the actual signer wallet address - this is the wallet that will be signing the transaction
  // For Privy embedded wallet, we need to get the actual connected wallet address
  const { address: signerAddress } = useAccount();

  // Utility functions
const getTokenType = (tokenAddress: string): TokenType => {
  return tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20';
};

const validateInputs = useCallback((params: DepositParams & { recipient: string }) => {
  const validation = validateDepositParams(params);
  if (!validation.isValid) {
    const error = new Error(validation.error);
    logger.error('Input validation failed', validation.error);
    throw error;
  }

  if (!params.recipient) {
    const error = new Error('Recipient address is required');
    logger.error('Missing recipient address');
    throw error;
  }

}, []);

const getBalanceManagerAddress = useCallback((currentChainId: number) => {
  const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[currentChainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

  if (!balanceManagerAddress) {
    const availableChains = Object.keys(BALANCE_MANAGER_ADDRESSES);
    const error = new Error(`BalanceManager contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
    logger.error('BalanceManager contract not found');
    throw error;
  }

  return balanceManagerAddress;
}, []);

const prepareAddresses = useCallback((tokenAddress: string, recipient: string) => {
  const checksumTokenAddress = getAddress(tokenAddress);
  const checksumRecipient = getAddress(recipient);

  return { checksumTokenAddress, checksumRecipient };
}, []);

  const { writeContract, data: hash } = useWriteContract({
    mutation: {
      onSuccess: () => {
        if (currentStep === 'approving') {
          logger.info('Approval completed, proceeding to deposit');
          setIsApproving(false);
        } else if (currentStep === 'depositing') {
          logger.success('Deposit transaction submitted');
          setCurrentStep('confirming');
          setIsPending(false);
        }
      },
      onError: (error) => {
        logger.error('Transaction failed', error.message);
        setIsPending(false);
        setIsApproving(false);
        setCurrentStep('error');
        setError(error);
        onError?.(error);
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (receiptError) {
      logger.error('Transaction receipt error', receiptError.message);
      setCurrentStep('error');
      setError(receiptError);
      setIsPending(false);
      setIsApproving(false);
      onError?.(receiptError);
      return;
    }

    if (receipt && currentStep === 'confirming') {
      if (receipt.status === 'reverted') {
        logger.error('Transaction failed on-chain');

        // Try to get the revert reason
        const getRevertReason = async () => {
          if (!publicClient || !hash) return 'Unknown revert reason';

          try {
            const tx = await publicClient.getTransaction({
              hash: hash as `0x${string}`
            });

            if (!tx) return 'Transaction not found';

            // Try to simulate the transaction to get revert reason
            try {
              await publicClient.call({
                to: tx.to,
                data: tx.input,
                value: tx.value
              });
              return 'Transaction reverted but no specific reason provided';
            } catch (callError: any) {
              const revertReason = callError.data?.data || callError.message || 'Unknown revert reason';
              return typeof revertReason === 'string' ? revertReason : 'Transaction reverted with unknown reason';
            }
          } catch (error: any) {
            return `Transaction reverted. Error: ${error.message}`;
          }
        };

        getRevertReason().then((revertReason) => {
          const error = new Error(`Transaction failed: ${revertReason}`);
          logger.error('Transaction failed with revert reason', revertReason);
          setCurrentStep('error');
          setError(error);
          setIsPending(false);
          setIsApproving(false);
          onError?.(error);
        });

        return;
      }

      logger.success('Transaction confirmed');
      setCurrentStep('completed');
      setError(null);
      onSuccess?.(hash as `0x${string}`);
    }
  }, [receipt, receiptError, currentStep, hash, onError, onSuccess, publicClient]);

  const deposit = async ({
    tokenAddress,
    amount,
    decimals,
    recipient,
  }: DepositParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep('validating');

      if (!recipient) {
        const error = new Error('Recipient address is required');
        logger.error('Missing recipient address');
        throw error;
      }

      // Validate inputs
      validateInputs({
        tokenAddress,
        amount,
        decimals,
        recipient
      });

      // Prepare addresses and amounts
      const { checksumTokenAddress, checksumRecipient } = prepareAddresses(tokenAddress, recipient);
      const amountInWei = parseUnits(amount, decimals);
      const balanceManagerAddress = getBalanceManagerAddress(chainId);

      // Determine token type and process accordingly
      const tokenType = getTokenType(tokenAddress);

      if (tokenType === 'ETH') {
        await processETHDeposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          chainId
        });
      } else {
        if (!signerAddress) {
          const error = new Error('No connected wallet found - cannot determine signer address');
          logger.error('Missing signer address');
          throw error;
        }

        await processERC20Deposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          amount,
          decimals,
          chainId,
          signerAddress: signerAddress as `0x${string}`
        });
      }

    } catch (err) {
      const parsedError = parseContractError(err);
      setIsPending(false);
      setIsApproving(false);
      setCurrentStep('error');
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  // Separate functions for different deposit types
  const processETHDeposit = async ({
    balanceManagerAddress,
    checksumTokenAddress,
    checksumRecipient,
    amountInWei,
    chainId
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    chainId: number;
  }) => {
    setCurrentStep('depositing');

    writeContract({
      address: balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'deposit',
      args: [
        checksumTokenAddress, // Currency (address)
        amountInWei, // Amount
        checksumRecipient, // From (user address)
        checksumRecipient, // To (user address)
      ],
      value: amountInWei,
      chainId,
    });
  };

  const processERC20Deposit = async ({
    balanceManagerAddress,
    checksumTokenAddress,
    checksumRecipient,
    amountInWei,
    amount,
    decimals,
    chainId,
    signerAddress
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    amount: string;
    decimals: number;
    chainId: number;
    signerAddress: `0x${string}`;
  }) => {
    // Step 1: Approval
    setCurrentStep('approving');
    setIsApproving(true);

    try {
      await approveToken({
        tokenAddress: checksumTokenAddress,
        amount,
        decimals,
      });

      // Step 2: Check allowance after approval confirmation
      let allowance: bigint | null = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts && (!allowance || allowance < amountInWei)) {
        attempts++;

        try {
          if (!publicClient) {
            throw new Error('Public client not available');
          }
          const allowanceResult = await publicClient.readContract({
            address: checksumTokenAddress,
            abi: [
              {
                "type": "function",
                "name": "allowance",
                "stateMutability": "view",
                "inputs": [
                  { "name": "owner", "type": "address" },
                  { "name": "spender", "type": "address" },
                ],
                "outputs": [{ "name": "", "type": "uint256" }],
              },
            ],
            functionName: 'allowance',
            args: [signerAddress, balanceManagerAddress],
          });

          allowance = allowanceResult as bigint;

          if (allowance >= amountInWei) {
            break;
          }

          if (allowance < amountInWei) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (checkError: any) {
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!allowance || allowance < amountInWei) {
        const error = new Error(`Approval verification failed: Allowance is ${allowance?.toString() || '0'}, but required ${amountInWei.toString()}`);
        throw error;
      }

    } catch (approvalError: any) {
      throw new Error(`Token approval failed: ${approvalError.message}`);
    }

    // Step 3: Check signer's token balance before proceeding with deposit
    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const balance = await publicClient.readContract({
        address: checksumTokenAddress,
        abi: [
          {
            "type": "function",
            "name": "balanceOf",
            "stateMutability": "view",
            "inputs": [{"name": "account", "type": "address"}],
            "outputs": [{"name": "", "type": "uint256"}],
          },
        ],
        functionName: 'balanceOf',
        args: [signerAddress]
      });

      if (balance < amountInWei) {
        throw new Error(`Insufficient token balance: ${balance.toString()}, required ${amountInWei.toString()}`);
      }

    } catch (balanceError: any) {
      throw new Error(`Balance verification failed: ${balanceError.message}`);
    }

    // Ensure we're in the correct step before submitting deposit
    if (currentStep !== 'depositing') {
      setCurrentStep('depositing');
    }

    writeContract({
      address: balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'depositLocal',
      args: [
        checksumTokenAddress, // Token address
        amountInWei, // Amount
        checksumRecipient, // Recipient
      ],
      chainId,
    });
  };

  const getBalance = useCallback((userAddress: string, tokenAddress: string) => {
    const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[chainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

    if (!balanceManagerAddress || !userAddress || !tokenAddress) {
      return null;
    }

    // Use the balance manager to get user balance
    return useReadContract({
      address: balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'getBalance',
      args: [userAddress as `0x${string}`, tokenAddress as `0x${string}`],
      chainId,
      query: {
        enabled: true,
        retry: 3,
        retryDelay: 1000,
      }
    });
  }, [chainId]);

  return {
    deposit,
    getBalance,
    isPending,
    isApproving,
    isConfirming,
    isConfirmed,
    error,
    hash,
    currentStep,
  };
}

// Utility function to format token amount for display
export function formatTokenAmount(amount: bigint | undefined, decimals: number): string {
  if (!amount) return '0';
  return formatUnits(amount, decimals);
}

// Utility function to check if user needs to approve tokens
export function needsApproval(
  tokenAddress: string,
  amount: string,
  decimals: number,
  allowance?: bigint
): boolean {
  // ETH doesn't need approval
  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    return false;
  }

  // If no allowance or insufficient allowance, approval is needed
  if (!allowance) {
    return true;
  }

  const amountInWei = parseUnits(amount, decimals);
  return allowance < amountInWei;
}