'use client';

import { parseContractError, validateDepositParams } from '@/utils/depositUtils';
import { useState, useCallback, useEffect } from 'react';
import { formatUnits, getAddress, parseUnits, erc20Abi } from 'viem';
import { useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Contract addresses from centralized config
const BALANCE_MANAGER_ADDRESSES = {
  84532: Contracts[84532].balanceManagerAddress
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

  // Initialize logger with wallet context
  const logger = useLogger();

  // Utility functions
const getTokenType = (tokenAddress: string): TokenType => {
  return tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20';
};

const validateInputs = useCallback((params: DepositParams & { recipient: string }) => {
  logger.log(LogLevel.DEBUG, 'Validating deposit inputs', LogLabel.DEPOSIT, ServiceName.WEBAPP, { params }, 'useDeposit.ts', 'validateInputs');

  const validation = validateDepositParams(params);
  if (!validation.isValid) {
    const error = new Error(validation.error);
    logger.log(LogLevel.ERROR, 'Input validation failed', LogLabel.DEPOSIT, ServiceName.WEBAPP, { validation }, 'useDeposit.ts', 'validateInputs');
    throw error;
  }

  if (!params.recipient) {
    const error = new Error('Recipient address is required');
    logger.log(LogLevel.ERROR, 'Missing recipient address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'validateInputs');
    throw error;
  }

  logger.log(LogLevel.DEBUG, 'Input validation successful', LogLabel.DEPOSIT, ServiceName.WEBAPP, { params }, 'useDeposit.ts', 'validateInputs');
}, [logger]);

const getBalanceManagerAddress = useCallback((currentChainId: number) => {
  logger.log(LogLevel.DEBUG, 'Getting BalanceManager address', LogLabel.DEPOSIT, ServiceName.WEBAPP, { currentChainId }, 'useDeposit.ts', 'getBalanceManagerAddress');

  const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[currentChainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

  if (!balanceManagerAddress) {
    const availableChains = Object.keys(BALANCE_MANAGER_ADDRESSES);
    const error = new Error(`BalanceManager contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
    logger.log(LogLevel.ERROR, 'BalanceManager contract not found', LogLabel.DEPOSIT, ServiceName.WEBAPP, { currentChainId, availableChains }, 'useDeposit.ts', 'getBalanceManagerAddress');
    throw error;
  }

  logger.log(LogLevel.DEBUG, 'BalanceManager address found', LogLabel.DEPOSIT, ServiceName.WEBAPP, { balanceManagerAddress }, 'useDeposit.ts', 'getBalanceManagerAddress');
  return balanceManagerAddress;
}, [logger]);

const prepareAddresses = useCallback((tokenAddress: string, recipient: string) => {
  logger.log(LogLevel.DEBUG, 'Preparing addresses', LogLabel.DEPOSIT, ServiceName.WEBAPP, { tokenAddress, recipient }, 'useDeposit.ts', 'prepareAddresses');

  const checksumTokenAddress = getAddress(tokenAddress);
  const checksumRecipient = getAddress(recipient);

  logger.log(LogLevel.DEBUG, 'Addresses prepared', LogLabel.DEPOSIT, ServiceName.WEBAPP, { checksumTokenAddress, checksumRecipient }, 'useDeposit.ts', 'prepareAddresses');
  return { checksumTokenAddress, checksumRecipient };
}, [logger]);

  const { writeContract, data: hash, writeContractAsync } = useWriteContract({
    mutation: {
      onSuccess: () => {
        if (currentStep === DepositStep.DEPOSITING) {
          logger.log(LogLevel.INFO, 'Deposit transaction successful', LogLabel.DEPOSIT, ServiceName.WEBAPP, { hash, currentStep }, 'useDeposit.ts', 'writeContract');
          setCurrentStep(DepositStep.CONFIRMING);
          setIsPending(false);
        }
      },
      onError: (error) => {
        logger.logError('Deposit transaction failed', { error: error.message || error, currentStep, errorType: 'writeContract' }, 'writeContract', 'useDeposit.ts');
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
      logger.logError('Deposit transaction failed', { error: receiptError.message || receiptError, currentStep, errorType: 'receiptError', hash }, 'useWaitForTransactionReceipt', 'useDeposit.ts');
      setCurrentStep(DepositStep.ERROR);
      setError(receiptError);
      setIsPending(false);
      setIsApproving(false);
      onError?.(receiptError);
      return;
    }

    if (receipt && currentStep === DepositStep.CONFIRMING) {
      if (receipt.status === 'reverted') {
        logger.log(LogLevel.ERROR, 'Transaction failed on-chain', LogLabel.DEPOSIT, ServiceName.WEBAPP, { hash, blockNumber: receipt.blockNumber }, 'useDeposit.ts', 'handleTransactionReceipt');

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
          logger.log(LogLevel.ERROR, 'Transaction failed with revert reason', LogLabel.DEPOSIT, ServiceName.WEBAPP, { revertReason, hash }, 'useDeposit.ts', 'handleTransactionReceipt');
          setCurrentStep(DepositStep.ERROR);
          setError(error);
          setIsPending(false);
          setIsApproving(false);
          onError?.(error);
        });

        return;
      }

      logger.log(LogLevel.INFO, 'Transaction confirmed successfully', LogLabel.DEPOSIT, ServiceName.WEBAPP, { hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed?.toString() }, 'useDeposit.ts', 'handleTransactionReceipt');
      setCurrentStep(DepositStep.COMPLETED);
      setError(null);
      onSuccess?.(hash as `0x${string}`);
    }
  }, [receipt, receiptError, currentStep, hash, onError, onSuccess, publicClient, logger]);

  const deposit = async ({
    tokenAddress,
    amount,
    decimals,
    recipient,
  }: DepositParams) => {
    logger.log(LogLevel.INFO, 'Deposit started', LogLabel.DEPOSIT, ServiceName.WEBAPP, { tokenAddress, amount, decimals, recipient }, 'useDeposit.ts', 'deposit');

    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(DepositStep.VALIDATING);

      if (!recipient) {
        const error = new Error('Recipient address is required');
        logger.log(LogLevel.ERROR, 'Missing recipient address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'deposit');
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
        logger.log(LogLevel.ERROR, 'Missing signer address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'deposit');
        throw error;
      }

      // Determine token type and process accordingly
      const tokenType = getTokenType(tokenAddress);

      logger.log(LogLevel.INFO, 'Processing deposit', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        tokenType,
        tokenAddress: checksumTokenAddress,
        amount: amount.toString(),
        recipient: checksumRecipient,
        balanceManagerAddress
      }, 'useDeposit.ts', 'deposit');

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
      logger.logError('Deposit failed', { error: parsedError.message || parsedError, tokenAddress, amount, decimals, recipient, errorType: 'deposit_function' }, 'deposit', 'useDeposit.ts');
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

    logger.log(LogLevel.INFO, 'Simulating ETH deposit transaction...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        balanceManagerAddress,
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processETHDeposit');

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

      logger.log(LogLevel.INFO, 'ETH deposit simulation successful', LogLabel.CONTRACT, ServiceName.WEBAPP, {
        contractName: 'BalanceManager',
        functionName: 'deposit',
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processETHDeposit');
    } catch (simulationError: any) {
      logger.log(LogLevel.ERROR, 'ETH deposit simulation failed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        error: simulationError.message || 'Unknown reason',
        balanceManagerAddress,
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient,
        signerAddress,
        errorType: 'simulation'
      }, 'useDeposit.ts', 'processETHDeposit');
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
    logger.log(LogLevel.INFO, 'Checking current token allowance...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        tokenAddress: checksumTokenAddress,
        signerAddress,
        balanceManagerAddress,
        decimals
      }, 'useDeposit.ts', 'processERC20Deposit');

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

      const currentAllowanceFormatted = formatUnits(currentAllowance, decimals);
      const requiredAmountFormatted = formatUnits(amountInWei, decimals);

      logger.log(LogLevel.INFO, 'Token allowance check completed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        currentAllowance: currentAllowanceFormatted,
        requiredAmount: requiredAmountFormatted,
        isSufficient: currentAllowance >= amountInWei,
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');
    } catch (error) {
      logger.logError('Failed to check current allowance', {
        error: error instanceof Error ? error.message : String(error),
        tokenAddress: checksumTokenAddress,
        signerAddress,
        balanceManagerAddress
      }, 'processERC20Deposit', 'useDeposit.ts');
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
        const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);
        const approvalAmount = maxUint256;

        logger.log(LogLevel.INFO, `Insufficient allowance. Requesting approval for ${approvalAmount === maxUint256 ? 'unlimited' : formatUnits(approvalAmount, decimals)} tokens`, LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalAmount: approvalAmount.toString(),
        amountInWei: amountInWei.toString(),
        isUnlimited: approvalAmount === maxUint256
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Simulate approval transaction first to catch errors early
        logger.log(LogLevel.INFO, 'Simulating approval transaction...', LogLabel.APPROVAL, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
        try {
          await publicClient.simulateContract({
            address: checksumTokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [balanceManagerAddress, approvalAmount],
            account: signerAddress,
          });
          logger.log(LogLevel.INFO, 'Approval simulation successful', LogLabel.APPROVAL, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
        } catch (simulationError: any) {
          logger.logError('Approval simulation failed', {
            error: simulationError.message || 'Unknown reason'
          }, 'processERC20Deposit', 'useDeposit.ts');
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

        logger.log(LogLevel.INFO, `Approval transaction submitted: ${approvalHash}`, LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash,
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Wait for approval transaction to confirm using publicClient
        logger.log(LogLevel.INFO, 'Waiting for approval transaction confirmation...', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash
      }, 'useDeposit.ts', 'processERC20Deposit');
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          confirmations: 1,
        });

        if (approvalReceipt.status === 'reverted') {
          throw new Error('Approval transaction reverted on-chain');
        }

        logger.log(LogLevel.INFO, 'Approval transaction confirmed', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash,
        status: receipt?.status
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Verify allowance was updated
        const updatedAllowance = await publicClient.readContract({
          address: checksumTokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [signerAddress, balanceManagerAddress],
        }) as bigint;

        if (updatedAllowance < amountInWei) {
          logger.logError('Allowance verification failed', {
            expected: formatUnits(amountInWei, decimals),
            actual: formatUnits(updatedAllowance, decimals),
            tokenAddress: checksumTokenAddress
          }, 'processERC20Deposit', 'useDeposit.ts');
          throw new Error(`Allowance verification failed. Expected at least: ${formatUnits(amountInWei, decimals)}, Got: ${formatUnits(updatedAllowance, decimals)}`);
        }

        logger.log(LogLevel.INFO, `Allowance verified: ${formatUnits(updatedAllowance, decimals)} tokens`, LogLabel.APPROVAL, ServiceName.WEBAPP, {
          updatedAllowance: updatedAllowance.toString(),
          tokenAddress: checksumTokenAddress
        }, 'useDeposit.ts', 'processERC20Deposit');

      } catch (approvalError: any) {
        logger.logError('Token approval failed', {
          error: approvalError.message || approvalError
        }, 'processERC20Deposit', 'useDeposit.ts');
        throw new Error(`Token approval failed: ${approvalError.message}`);
      } finally {
        setIsApproving(false);
      }
    } else {
      logger.log(LogLevel.INFO, 'Sufficient allowance already exists, skipping approval step', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        currentAllowance: currentAllowance.toString(),
        requiredAmount: amountInWei.toString(),
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');
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

      logger.log(LogLevel.INFO, `Token balance: ${formatUnits(balance, decimals)}`, LogLabel.BALANCE, ServiceName.WEBAPP, {
        balance: balance.toString(),
        decimals
      }, 'useDeposit.ts', 'processERC20Deposit');

      if (balance < amountInWei) {
        logger.logError('Insufficient token balance', {
          required: formatUnits(amountInWei, decimals),
          available: formatUnits(balance, decimals),
          tokenAddress: checksumTokenAddress
        }, 'processERC20Deposit', 'useDeposit.ts');
        throw new Error(`Insufficient token balance. Required: ${formatUnits(amountInWei, decimals)}, Available: ${formatUnits(balance, decimals)}`);
      }

    } catch (balanceError: unknown) {
      const error = balanceError as Error;
      logger.logError('Balance verification failed', {
        error: error.message || 'Unknown error'
      }, 'processERC20Deposit', 'useDeposit.ts');
      throw new Error(`Balance verification failed: ${error.message}`);
    }

    // ========================================
    // STEP 4: Simulate deposit transaction
    // ========================================
    logger.log(LogLevel.INFO, 'Simulating ERC-20 deposit transaction...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
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
      logger.log(LogLevel.INFO, 'ERC-20 deposit simulation successful', LogLabel.CONTRACT, ServiceName.WEBAPP, {
        contractName: 'BalanceManager',
        functionName: 'depositLocal',
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processERC20Deposit');
    } catch (simulationError: any) {
      logger.logError('ERC-20 deposit simulation failed', {
        error: simulationError.message || 'Unknown reason'
      }, 'processERC20Deposit', 'useDeposit.ts');
      throw new Error(`Deposit will fail: ${simulationError.message || 'Unknown reason'}`);
    }

    // ========================================
    // STEP 5: Execute deposit transaction
    // ========================================
    setCurrentStep(DepositStep.DEPOSITING);
    logger.log(LogLevel.INFO, 'Submitting deposit transaction', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');

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