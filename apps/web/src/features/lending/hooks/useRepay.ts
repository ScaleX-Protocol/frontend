'use client';

import { formatTokenAmount, parseContractError } from '@/utils/repayUtils';
import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits, erc20Abi } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { Contracts, ScaleXRouterABI } from '@/configs/contracts';
import { ChainConfig, getViemChain } from '@/configs/chain';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { logger } from '@/utils/prodLogger';

// Contract addresses from centralized config
const ROUTER_ADDRESSES = Contracts;

// Get target chain ID from router address
const getTargetChainId = (routerAddress: string): number => {
  for (const [chainId, contracts] of Object.entries(ROUTER_ADDRESSES)) {
    if (contracts.scaleXRouterAddress === routerAddress) {
      return parseInt(chainId);
    }
  }
  // Fallback to default chain from config
  return ChainConfig.defaultChainId;
};

export enum RepayStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  CHECKING_ALLOWANCE = 'checking_allowance',
  APPROVING = 'approving',
  SIMULATING = 'simulating',
  REPAYING = 'repaying',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UseRepayOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface RepayParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
}


// Create contextual logger for useRepay hook
const log = logger.withContext({ hook: 'useRepay' });

export function useRepay({ onSuccess, onError }: UseRepayOptions = {}) {
  const logger = useLogger();

  const [isPending, setIsPending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<RepayStep>(RepayStep.IDLE);
  const [receipt, setReceipt] = useState<any | null>(null);

  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Get the embedded wallet (first wallet from Privy)
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const address = embeddedWallet?.address || user?.wallet?.address;

  const getRouterAddress = useCallback((chainId?: number) => {
    const targetChainId = chainId || ChainConfig.defaultChainId;
    const chainContracts = ROUTER_ADDRESSES[targetChainId as keyof typeof ROUTER_ADDRESSES];

    if (!chainContracts) {
      const availableChains = Object.keys(ROUTER_ADDRESSES);
      const error = new Error(`ScaleXRouter contract not found on chain ${targetChainId}. Available chains: ${availableChains.join(', ')}`);
      logger.logError('ScaleXRouter contract not found', { targetChainId, availableChains }, 'getRouterAddress', 'useRepay.ts');
      throw error;
    }

    const routerAddress = chainContracts.scaleXRouterAddress;
    return { address: routerAddress, chainId: targetChainId };
  }, [logger]);

  // Chain switching function
  const switchWalletChain = useCallback(async (targetChainId: number) => {
    if (!embeddedWallet) {
      throw new Error('No embedded wallet available for chain switching');
    }

    try {
      await embeddedWallet.switchChain(targetChainId);
    } catch (error) {
      try {
        // Attempt to add chain if it doesn't exist
        const chainConfig = getViemChain(targetChainId);
        const provider = await embeddedWallet.getEthereumProvider();

        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: chainConfig.name,
            nativeCurrency: chainConfig.nativeCurrency,
            rpcUrls: chainConfig.rpcUrls.default.http,
            blockExplorerUrls: chainConfig.blockExplorers
              ? [chainConfig.blockExplorers.default.url]
              : [],
          }],
        });

        // Retry chain switching after adding
        await embeddedWallet.switchChain(targetChainId);
      } catch (addError) {
        throw new Error(`Failed to switch to chain ${targetChainId}: ${(addError as any).message}`);
      }
    }
  }, [embeddedWallet]);

  const executeTransaction = useCallback(async (contractCall: any) => {
    if (!ready || !authenticated || !embeddedWallet || !address) {
      throw new Error('Wallet not connected or not ready');
    }

    try {
      // 1. Detect target chain from contract address
      const targetChainId = getTargetChainId(contractCall.address);

      // 2. Switch to target chain if needed
      await switchWalletChain(targetChainId);

      // 3. Get provider from embedded wallet
      const provider = await embeddedWallet.getEthereumProvider();

      // 4. Create wallet client with correct chain
      const chainConfig = getViemChain(targetChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // 5. Simulate transaction first to catch errors early
      setCurrentStep(RepayStep.SIMULATING);
      logger.log(LogLevel.INFO, 'Simulating transaction...', LogLabel.TRADING, ServiceName.WEBAPP, {}, 'useRepay.ts', 'executeTransaction');

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        logger.log(LogLevel.INFO, 'Transaction simulation successful', LogLabel.TRADING, ServiceName.WEBAPP, {}, 'useRepay.ts', 'executeTransaction');
      } catch (simulationError: any) {
        logger.logError('Transaction simulation failed', { error: simulationError.message || simulationError }, 'executeTransaction', 'useRepay.ts');

        // Try to extract more detailed error information
        let errorMessage = 'Unknown reason';

        // Walk through viem's error chain to find the root cause
        let currentError = simulationError;
        let foundError = false;

        // Try to find the actual contract error in the error chain
        while (currentError && !foundError) {
          // Check for error signature or name
          const errorName = currentError.name || currentError.cause?.name;
          const errorData = currentError.data || currentError.cause?.data;

          // Check if we found a specific contract error
          if (errorName && errorName !== 'ContractFunctionRevertedError') {
            if (errorName === 'InsufficientBalance' || errorName.includes('InsufficientBalance')) {
              errorMessage = 'Insufficient balance to repay.';
              foundError = true;
            } else if (errorName === 'InvalidAmount' || errorName.includes('InvalidAmount')) {
              errorMessage = 'Invalid repay amount. Please check the amount and try again.';
              foundError = true;
            } else if (errorName === 'UnsupportedAsset' || errorName.includes('UnsupportedAsset')) {
              errorMessage = 'This asset is not supported for repayment.';
              foundError = true;
            } else if (errorName === 'RepayFailed' || errorName.includes('RepayFailed')) {
              errorMessage = 'Repay operation failed. Please try again.';
              foundError = true;
            } else if (errorName === 'UnauthorizedCaller' || errorName.includes('UnauthorizedCaller')) {
              errorMessage = 'Unauthorized to perform this operation.';
              foundError = true;
            } else if (errorName !== 'Error' && errorName !== 'ContractFunctionRevertedError') {
              errorMessage = `Contract error: ${errorName}`;
              foundError = true;
            }
          }

          // Fallback: Check error data/signature for errors that viem didn't decode
          if (!foundError && errorData) {
            if (typeof errorData === 'string' && errorData.startsWith('0x')) {
              errorMessage = `Contract reverted with data: ${errorData}`;
              foundError = true;
            }
          }

          // Move to next error in chain
          currentError = currentError.cause;
        }

        // If still no specific error found, check the message for patterns
        if (!foundError) {
          const fullMessage = simulationError.message || simulationError.shortMessage || '';

          if (fullMessage.includes('InsufficientBalance')) {
            errorMessage = 'Insufficient balance to repay. Please check your wallet balance and try again.';
          } else if (fullMessage.includes('InvalidAmount') || fullMessage.includes('ZeroAmount')) {
            errorMessage = 'Invalid repay amount. Please check the amount and try again.';
          } else if (fullMessage.includes('TransferError')) {
            errorMessage = 'Token transfer failed. Please check your allowance and balance.';
          } else if (fullMessage.includes('UnsupportedAsset') || fullMessage.includes('TokenNotSupported')) {
            errorMessage = 'This asset is not supported for repayment.';
          } else if (fullMessage.includes('RepayFailed')) {
            errorMessage = 'Repay operation failed. Please try again.';
          } else {
            errorMessage = 'Transaction simulation failed. Please check your account and try again.';
          }
        }

        // Log the full error for debugging
        log.error('Full simulation error', {
          message: simulationError.message,
          shortMessage: simulationError.shortMessage,
          details: simulationError.details,
          name: simulationError.name,
          cause: simulationError.cause,
        });

        throw new Error(`Transaction will fail: ${errorMessage}`);
      }

      // 6. Execute the contract call
      setCurrentStep(RepayStep.REPAYING);
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      logger.log(LogLevel.INFO, 'Transaction submitted', LogLabel.TRADING, ServiceName.WEBAPP, { txHash }, 'useRepay.ts', 'executeTransaction');
      setHash(txHash);

      // 7. Wait for confirmation
      setCurrentStep(RepayStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      setReceipt(txReceipt);

      // 8. Check transaction status
      if (txReceipt.status === 'reverted') {
        logger.log(LogLevel.ERROR, 'Transaction failed on-chain', LogLabel.TRADING, ServiceName.WEBAPP, { txHash }, 'useRepay.ts', 'executeTransaction');

        // Try to get the revert reason
        const getRevertReason = async () => {
          try {
            const tx = await walletClient.getTransaction({
              hash: txHash as `0x${string}`
            });

            if (!tx) return 'Transaction not found';

            // Try to simulate the transaction to get revert reason
            try {
              await walletClient.call({
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

        const revertReason = await getRevertReason();
        throw new Error(`Transaction failed: ${revertReason}`);
      }

      logger.log(LogLevel.INFO, 'Transaction confirmed', LogLabel.TRADING, ServiceName.WEBAPP, { txHash: txReceipt.transactionHash }, 'useRepay.ts', 'executeTransaction');
      setCurrentStep(RepayStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(RepayStep.ERROR);
      logger.logError('Transaction failed', { error: error instanceof Error ? error.message : String(error) }, 'executeTransaction', 'useRepay.ts');
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain, logger]);

  const approveToken = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
  ): Promise<void> => {
    if (!ready || !authenticated || !embeddedWallet || !address) {
      throw new Error('Wallet not connected or not ready');
    }

    try {
      setCurrentStep(RepayStep.APPROVING);
      setIsApproving(true);

      // Get provider and create wallet client
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(ChainConfig.defaultChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      logger.log(LogLevel.INFO, 'Approving token...', LogLabel.TRADING, ServiceName.WEBAPP, { tokenAddress, spenderAddress, amount: amount.toString() }, 'useRepay.ts', 'approveToken');

      // Execute approval
      const approvalHash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amount],
      });

      logger.log(LogLevel.INFO, 'Approval transaction submitted', LogLabel.TRADING, ServiceName.WEBAPP, { approvalHash }, 'useRepay.ts', 'approveToken');

      // Wait for approval confirmation
      const approvalReceipt = await walletClient.waitForTransactionReceipt({
        hash: approvalHash,
        timeout: 60_000,
      });

      if (approvalReceipt.status === 'reverted') {
        throw new Error('Token approval failed');
      }

      logger.log(LogLevel.INFO, 'Token approved successfully', LogLabel.TRADING, ServiceName.WEBAPP, { approvalHash }, 'useRepay.ts', 'approveToken');
      setIsApproving(false);
    } catch (error) {
      setIsApproving(false);
      logger.logError('Token approval failed', { error: error instanceof Error ? error.message : String(error) }, 'approveToken', 'useRepay.ts');
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, logger]);

  const checkAllowance = useCallback(async (
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> => {
    if (!embeddedWallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(ChainConfig.defaultChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      const allowance = await walletClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
      }) as bigint;

      return allowance;
    } catch (error) {
      logger.logError('Failed to check allowance', { error: error instanceof Error ? error.message : String(error) }, 'checkAllowance', 'useRepay.ts');
      return 0n;
    }
  }, [embeddedWallet, address, logger]);

  const repay = async ({
    tokenAddress,
    amount,
    decimals,
  }: RepayParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(RepayStep.VALIDATING);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        const error = new Error('Please connect your wallet first');
        logger.logError('Wallet not connected', {}, 'repay', 'useRepay.ts');
        throw error;
      }

      // Validate inputs
      if (!tokenAddress) {
        const error = new Error('Token address is required');
        logger.logError('Invalid token address', {}, 'repay', 'useRepay.ts');
        throw error;
      }

      if (!amount || parseFloat(amount) <= 0) {
        const error = new Error('Invalid amount: must be greater than 0');
        logger.logError('Invalid amount', {}, 'repay', 'useRepay.ts');
        throw error;
      }

      // Prepare addresses and amounts
      const { address: routerAddress } = getRouterAddress();
      const checksumTokenAddress = getAddress(tokenAddress);
      const amountInWei = parseUnits(amount, decimals);

      logger.log(LogLevel.INFO, `Repaying ${amount} tokens`, LogLabel.TRADING, ServiceName.WEBAPP, { tokenAddress, amount }, 'useRepay.ts', 'repay');

      // Check and handle token approval - approve the router, not balance manager
      setCurrentStep(RepayStep.CHECKING_ALLOWANCE);
      const currentAllowance = await checkAllowance(
        checksumTokenAddress,
        address,
        routerAddress
      );

      if (currentAllowance < amountInWei) {
        logger.log(LogLevel.INFO, 'Insufficient allowance, requesting approval', LogLabel.TRADING, ServiceName.WEBAPP, {
          currentAllowance: currentAllowance.toString(),
          required: amountInWei.toString()
        }, 'useRepay.ts', 'repay');

        await approveToken(checksumTokenAddress, routerAddress, amountInWei);
      }

      // Execute repay transaction (includes simulation, submission, and confirmation)
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'repay',
        args: [
          checksumTokenAddress, // Token address
          amountInWei, // Amount
        ],
      });

      logger.log(LogLevel.INFO, 'Repay successful', LogLabel.TRADING, ServiceName.WEBAPP, { txHash }, 'useRepay.ts', 'repay');

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Repay failed', { error: parsedError.message || parsedError }, 'repay', 'useRepay.ts');

      setIsPending(false);
      setCurrentStep(RepayStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    repay,
    isPending,
    isApproving,
    isConfirming,
    isConfirmed: currentStep === RepayStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt,
    isAuthenticated: ready && authenticated && !!address,
    address,
  };
}

