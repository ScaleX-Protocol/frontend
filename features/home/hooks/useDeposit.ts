'use client';

import { parseContractError, validateDepositParams } from '@/utils/depositUtils';
import { useState, useCallback, useEffect } from 'react';
import { formatUnits, getAddress, parseUnits, erc20Abi } from 'viem';
import { useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';

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
  error: (message: string, error?: unknown) => {
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

export enum DepositStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  APPROVING = 'approving',
  DEPOSITING = 'depositing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export function useDeposit({ onSuccess, onError }: UseDepositOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.IDLE);

  // Get current chain ID and public client
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });

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

  const { writeContract, data: hash, writeContractAsync } = useWriteContract({
    mutation: {
      onSuccess: () => {
        if (currentStep === DepositStep.DEPOSITING) {
          logger.success('Deposit transaction submitted');
          setCurrentStep(DepositStep.CONFIRMING);
          setIsPending(false);
        }
      },
      onError: (error) => {
        logger.error('Transaction failed', error.message);
        setIsPending(false);
        setIsApproving(false);
        setCurrentStep(DepositStep.ERROR);
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
      setCurrentStep(DepositStep.ERROR);
      setError(receiptError);
      setIsPending(false);
      setIsApproving(false);
      onError?.(receiptError);
      return;
    }

    if (receipt && currentStep === DepositStep.CONFIRMING) {
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
            } catch (callError: unknown) {
              const errorObj = callError as { data?: { data?: string }; message?: string };
              const revertReason = errorObj?.data?.data || errorObj?.message || 'Unknown revert reason';
              return typeof revertReason === 'string' ? revertReason : 'Transaction reverted with unknown reason';
            }
          } catch (error: unknown) {
            return `Transaction reverted. Error: ${(error as Error).message}`;
          }
        };

        getRevertReason().then((revertReason) => {
          const error = new Error(`Transaction failed: ${revertReason}`);
          logger.error('Transaction failed with revert reason', revertReason);
          setCurrentStep(DepositStep.ERROR);
          setError(error);
          setIsPending(false);
          setIsApproving(false);
          onError?.(error);
        });

        return;
      }

      logger.success('Transaction confirmed');
      setCurrentStep(DepositStep.COMPLETED);
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
      setCurrentStep(DepositStep.VALIDATING);

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

      // Verify signer address exists
      if (!signerAddress) {
        const error = new Error('No connected wallet found - cannot determine signer address');
        logger.error('Missing signer address');
        throw error;
      }

      // Determine token type and process accordingly
      const tokenType = getTokenType(tokenAddress);

      if (tokenType === 'ETH') {
        await processETHDeposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          chainId,
          signerAddress: signerAddress as `0x${string}`
        });
      } else {
        await processERC20Deposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          decimals,
          chainId,
          signerAddress: signerAddress as `0x${string}`
        });
      }

    } catch (err) {
      const parsedError = parseContractError(err);
      setIsPending(false);
      setIsApproving(false);
      setCurrentStep(DepositStep.ERROR);
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
    chainId,
    signerAddress
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    chainId: number;
    signerAddress: `0x${string}`;
  }) => {
    // Simulate ETH deposit transaction first to catch errors early
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    logger.info('Simulating ETH deposit transaction...');
    try {
      await publicClient.simulateContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'deposit',
        args: [
          checksumTokenAddress,
          amountInWei,
          checksumRecipient,
          checksumRecipient,
        ],
        value: amountInWei,
        account: signerAddress,
      });
      logger.success('ETH deposit simulation successful');
    } catch (simulationError: any) {
      logger.error('ETH deposit simulation failed', simulationError);
      throw new Error(`ETH deposit will fail: ${simulationError.message || 'Unknown reason'}`);
    }

    setCurrentStep(DepositStep.DEPOSITING);

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
    decimals,
    chainId,
    signerAddress
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    decimals: number;
    chainId: number;
    signerAddress: `0x${string}`;
  }) => {
    // ========================================
    // STEP 1: Check existing allowance first
    // ========================================
    logger.info('Checking current token allowance...');

    if (!publicClient) {
      throw new Error('Public client not available');
    }

    let currentAllowance: bigint;
    try {
      currentAllowance = await publicClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [signerAddress, balanceManagerAddress],
      }) as bigint;

      logger.info(`Current allowance: ${formatUnits(currentAllowance, decimals)} ${checksumTokenAddress}`);
      logger.info(`Required amount: ${formatUnits(amountInWei, decimals)} ${checksumTokenAddress}`);
    } catch (error) {
      logger.error('Failed to check current allowance', error);
      throw new Error(`Cannot verify token allowance: ${(error as Error).message}`);
    }

    // ========================================
    // STEP 2: Only approve if needed
    // ========================================
    if (currentAllowance < amountInWei) {
      setCurrentStep(DepositStep.APPROVING);
      setIsApproving(true);

      try {
        // Calculate approval amount
        // Strategy: Approve unlimited for best UX (one-time approval)
        // Alternative: Use amountInWei for exact amount, or amountInWei * 10n for buffered
        const maxUint256 = 2n ** 256n - 1n;
        const approvalAmount = maxUint256;

        logger.info(`Insufficient allowance. Requesting approval for ${approvalAmount === maxUint256 ? 'unlimited' : formatUnits(approvalAmount, decimals)} tokens`);

        // Simulate approval transaction first to catch errors early
        logger.info('Simulating approval transaction...');
        try {
          await publicClient.simulateContract({
            address: checksumTokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [balanceManagerAddress, approvalAmount],
            account: signerAddress,
          });
          logger.success('Approval simulation successful');
        } catch (simulationError: any) {
          logger.error('Approval simulation failed', simulationError);
          throw new Error(`Approval will fail: ${simulationError.message || 'Unknown reason'}`);
        }

        // Submit approval transaction using writeContractAsync
        const approvalHash = await writeContractAsync({
          address: checksumTokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [balanceManagerAddress, approvalAmount],
          chainId,
        });

        logger.info(`Approval transaction submitted: ${approvalHash}`);

        // Wait for approval transaction to confirm using publicClient
        logger.info('Waiting for approval transaction confirmation...');
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          confirmations: 1,
        });

        if (approvalReceipt.status === 'reverted') {
          throw new Error('Approval transaction reverted on-chain');
        }

        logger.success('Approval transaction confirmed');

        // Verify allowance was updated
        const updatedAllowance = await publicClient.readContract({
          address: checksumTokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [signerAddress, balanceManagerAddress],
        }) as bigint;

        if (updatedAllowance < amountInWei) {
          throw new Error(`Allowance verification failed. Expected at least: ${formatUnits(amountInWei, decimals)}, Got: ${formatUnits(updatedAllowance, decimals)}`);
        }

        logger.success(`Allowance verified: ${formatUnits(updatedAllowance, decimals)} tokens`);

      } catch (approvalError: any) {
        logger.error('Token approval failed', approvalError);
        throw new Error(`Token approval failed: ${approvalError.message}`);
      } finally {
        setIsApproving(false);
      }
    } else {
      logger.success('Sufficient allowance already exists, skipping approval step');
    }

    // ========================================
    // STEP 3: Check signer's token balance before proceeding with deposit
    // ========================================
    try {
      const balance = await publicClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [signerAddress]
      }) as bigint;

      logger.info(`Token balance: ${formatUnits(balance, decimals)}`);

      if (balance < amountInWei) {
        throw new Error(`Insufficient token balance. Required: ${formatUnits(amountInWei, decimals)}, Available: ${formatUnits(balance, decimals)}`);
      }

    } catch (balanceError: unknown) {
      const error = balanceError as Error;
      logger.error('Balance verification failed', error);
      throw new Error(`Balance verification failed: ${error.message}`);
    }

    // ========================================
    // STEP 4: Simulate deposit transaction
    // ========================================
    logger.info('Simulating ERC-20 deposit transaction...');
    try {
      await publicClient.simulateContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'depositLocal',
        args: [
          checksumTokenAddress,
          amountInWei,
          checksumRecipient,
        ],
        account: signerAddress,
      });
      logger.success('ERC-20 deposit simulation successful');
    } catch (simulationError: any) {
      logger.error('ERC-20 deposit simulation failed', simulationError);
      throw new Error(`Deposit will fail: ${simulationError.message || 'Unknown reason'}`);
    }

    // ========================================
    // STEP 5: Execute deposit transaction
    // ========================================
    setCurrentStep(DepositStep.DEPOSITING);
    logger.info('Submitting deposit transaction...');

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
    if (!userAddress || !tokenAddress) {
      return null;
    }

    // Use ERC20 balanceOf to get wallet balance
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
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