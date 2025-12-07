'use client';

import { parseContractError, validateWithdrawParams } from '@/utils/withdrawUtils';
import { useState, useCallback, useEffect } from 'react';
import { getAddress, parseUnits } from 'viem';
import { useChainId, useWaitForTransactionReceipt, useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Contract addresses from centralized config
const BALANCE_MANAGER_ADDRESSES = {
  84532: Contracts[84532].balanceManagerAddress
};

interface UseWithdrawOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface WithdrawParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
}

export enum WithdrawStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  WITHDRAWING = 'withdrawing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export function useWithdraw({ onSuccess, onError }: UseWithdrawOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<WithdrawStep>(WithdrawStep.IDLE);

  // Get current chain ID and public client
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });

  // Get the actual signer wallet address
  const { address: signerAddress } = useAccount();

  // Initialize logger
  const logger = useLogger();

  // Utility functions
  const validateInputs = useCallback((params: WithdrawParams & { user: string }) => {
    logger.log(LogLevel.DEBUG, 'Validating withdraw inputs', LogLabel.WITHDRAW, ServiceName.WEBAPP, { params }, 'useWithdraw.ts', 'validateInputs');

    const validation = validateWithdrawParams(params);
    if (!validation.isValid) {
      const error = new Error(validation.error);
      logger.log(LogLevel.ERROR, 'Input validation failed', LogLabel.WITHDRAW, ServiceName.WEBAPP, { validation }, 'useWithdraw.ts', 'validateInputs');
      throw error;
    }

    if (!params.user) {
      const error = new Error('User address is required');
      logger.log(LogLevel.ERROR, 'Missing user address', LogLabel.WITHDRAW, ServiceName.WEBAPP, {}, 'useWithdraw.ts', 'validateInputs');
      throw error;
    }

    logger.log(LogLevel.DEBUG, 'Input validation successful', LogLabel.WITHDRAW, ServiceName.WEBAPP, { params }, 'useWithdraw.ts', 'validateInputs');
  }, [logger]);

  const getBalanceManagerAddress = useCallback((currentChainId: number) => {
    logger.log(LogLevel.DEBUG, 'Getting BalanceManager address', LogLabel.WITHDRAW, ServiceName.WEBAPP, { currentChainId }, 'useWithdraw.ts', 'getBalanceManagerAddress');

    const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[currentChainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

    if (!balanceManagerAddress) {
      const availableChains = Object.keys(BALANCE_MANAGER_ADDRESSES);
      const error = new Error(`BalanceManager contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
      logger.log(LogLevel.ERROR, 'BalanceManager contract not found', LogLabel.WITHDRAW, ServiceName.WEBAPP, { currentChainId, availableChains }, 'useWithdraw.ts', 'getBalanceManagerAddress');
      throw error;
    }

    logger.log(LogLevel.DEBUG, 'BalanceManager address found', LogLabel.WITHDRAW, ServiceName.WEBAPP, { balanceManagerAddress }, 'useWithdraw.ts', 'getBalanceManagerAddress');
    return balanceManagerAddress;
  }, [logger]);

  const prepareAddresses = useCallback((tokenAddress: string, user: string) => {
    logger.log(LogLevel.DEBUG, 'Preparing addresses', LogLabel.WITHDRAW, ServiceName.WEBAPP, { tokenAddress, user }, 'useWithdraw.ts', 'prepareAddresses');

    const checksumTokenAddress = getAddress(tokenAddress);
    const checksumUser = getAddress(user);

    logger.log(LogLevel.DEBUG, 'Addresses prepared', LogLabel.WITHDRAW, ServiceName.WEBAPP, { checksumTokenAddress, checksumUser }, 'useWithdraw.ts', 'prepareAddresses');
    return { checksumTokenAddress, checksumUser };
  }, [logger]);

  const { writeContract, data: hash } = useWriteContract({
    mutation: {
      onSuccess: () => {
        if (currentStep === WithdrawStep.WITHDRAWING) {
          logger.log(LogLevel.INFO, 'Withdraw transaction successful', LogLabel.WITHDRAW, ServiceName.WEBAPP, { hash, currentStep }, 'useWithdraw.ts', 'writeContract');
          setCurrentStep(WithdrawStep.CONFIRMING);
          setIsPending(false);
        }
      },
      onError: (error) => {
        logger.logError('Withdraw transaction failed', { error: error.message || error, currentStep, errorType: 'writeContract' }, 'writeContract', 'useWithdraw.ts');
        setIsPending(false);
        setCurrentStep(WithdrawStep.ERROR);
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
      logger.logError('Withdraw transaction failed', { error: receiptError.message || receiptError, currentStep, errorType: 'receiptError', hash }, 'useWaitForTransactionReceipt', 'useWithdraw.ts');
      setCurrentStep(WithdrawStep.ERROR);
      setError(receiptError);
      setIsPending(false);
      onError?.(receiptError);
      return;
    }

    if (receipt && currentStep === WithdrawStep.CONFIRMING) {
      if (receipt.status === 'reverted') {
        logger.log(LogLevel.ERROR, 'Transaction failed on-chain', LogLabel.WITHDRAW, ServiceName.WEBAPP, { hash, blockNumber: receipt.blockNumber }, 'useWithdraw.ts', 'handleTransactionReceipt');

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
          logger.log(LogLevel.ERROR, 'Transaction failed with revert reason', LogLabel.WITHDRAW, ServiceName.WEBAPP, { revertReason, hash }, 'useWithdraw.ts', 'handleTransactionReceipt');
          setCurrentStep(WithdrawStep.ERROR);
          setError(error);
          setIsPending(false);
          onError?.(error);
        });

        return;
      }

      logger.log(LogLevel.INFO, 'Transaction confirmed successfully', LogLabel.WITHDRAW, ServiceName.WEBAPP, { hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed?.toString() }, 'useWithdraw.ts', 'handleTransactionReceipt');
      setCurrentStep(WithdrawStep.COMPLETED);
      setError(null);
      onSuccess?.(hash as `0x${string}`);
    }
  }, [receipt, receiptError, currentStep, hash, onError, onSuccess, publicClient, logger]);

  const withdraw = async ({
    tokenAddress,
    amount,
    decimals,
  }: WithdrawParams) => {
    logger.log(LogLevel.INFO, 'Withdraw started', LogLabel.WITHDRAW, ServiceName.WEBAPP, { tokenAddress, amount, decimals }, 'useWithdraw.ts', 'withdraw');

    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(WithdrawStep.VALIDATING);

      // Verify signer address exists
      if (!signerAddress) {
        const error = new Error('No connected wallet found - cannot determine signer address');
        logger.log(LogLevel.ERROR, 'Missing signer address', LogLabel.WITHDRAW, ServiceName.WEBAPP, {}, 'useWithdraw.ts', 'withdraw');
        throw error;
      }

      // Validate inputs
      validateInputs({
        tokenAddress,
        amount,
        decimals,
        user: signerAddress
      });

      // Prepare addresses and amounts
      const { checksumTokenAddress, checksumUser } = prepareAddresses(tokenAddress, signerAddress);
      const amountInWei = parseUnits(amount, decimals);
      const balanceManagerAddress = getBalanceManagerAddress(chainId);

      logger.log(LogLevel.INFO, 'Processing withdrawal', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
        tokenAddress: checksumTokenAddress,
        amount: amount.toString(),
        user: checksumUser,
        balanceManagerAddress
      }, 'useWithdraw.ts', 'withdraw');

      // Simulate withdrawal transaction first to catch errors early
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      logger.log(LogLevel.INFO, 'Simulating withdrawal transaction...', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
        balanceManagerAddress,
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumUser
      }, 'useWithdraw.ts', 'withdraw');

      try {
        await publicClient.simulateContract({
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'withdraw',
          args: [
            checksumTokenAddress,
            amountInWei,
            checksumUser,
          ],
          account: signerAddress as `0x${string}`,
        });

        logger.log(LogLevel.INFO, 'Withdrawal simulation successful', LogLabel.CONTRACT, ServiceName.WEBAPP, {
          contractName: 'BalanceManager',
          functionName: 'withdraw',
          checksumTokenAddress,
          amountInWei: amountInWei.toString(),
          checksumUser
        }, 'useWithdraw.ts', 'withdraw');
      } catch (simulationError: any) {
        logger.log(LogLevel.ERROR, 'Withdrawal simulation failed', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
          error: simulationError.message || 'Unknown reason',
          balanceManagerAddress,
          checksumTokenAddress,
          amountInWei: amountInWei.toString(),
          checksumUser,
          signerAddress,
          errorType: 'simulation'
        }, 'useWithdraw.ts', 'withdraw');
        throw new Error(`Withdrawal will fail: ${simulationError.message || 'Unknown reason'}`);
      }

      setCurrentStep(WithdrawStep.WITHDRAWING);

      // Execute withdrawal transaction
      writeContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'withdraw',
        args: [
          checksumTokenAddress, // Currency (token address)
          amountInWei, // Amount
          checksumUser, // User address
        ],
        chainId,
      });

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Withdrawal failed', { error: parsedError.message || parsedError, tokenAddress, amount, decimals, errorType: 'withdraw_function' }, 'withdraw', 'useWithdraw.ts');
      setIsPending(false);
      setCurrentStep(WithdrawStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    withdraw,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    currentStep,
  };
}
