'use client';

import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Contracts, ScaleXRouterABI, ChainConfig } from '@scalex/service-wallet';
import { formatTokenAmount, parseContractError } from '../utils/lending.helper';

// Simple logger replacement (platform-agnostic)
const logger = {
  logError: (...args: any[]) => console.error(...args),
  log: (...args: any[]) => console.log(...args),
};

// Contract addresses from centralized config
const ROUTER_ADDRESSES = Contracts;

// Map chain IDs to viem chain objects
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return baseSepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

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

export enum BorrowStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SIMULATING = 'simulating',
  BORROWING = 'borrowing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UseBorrowOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface BorrowParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
}


export function useBorrow({ onSuccess, onError }: UseBorrowOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<BorrowStep>(BorrowStep.IDLE);
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
      console.error('ScaleXRouter contract not found', { targetChainId, availableChains });
      throw error;
    }

    const routerAddress = chainContracts.scaleXRouterAddress;
    return { address: routerAddress, chainId: targetChainId };
  }, []);

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
      setCurrentStep(BorrowStep.SIMULATING);
      console.log( 'Simulating transaction...',);

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        console.log( 'Transaction simulation successful',);
      } catch (simulationError: any) {
        console.error('Transaction simulation failed', { error: simulationError.message || simulationError }, 'executeTransaction', 'useBorrow.ts');

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
              errorMessage = 'Insufficient balance in BalanceManager for this borrow operation.';
              foundError = true;
            } else if (errorName === 'InsufficientCollateral' || errorName.includes('InsufficientCollateral')) {
              errorMessage = 'Insufficient collateral. Please deposit more collateral before borrowing.';
              foundError = true;
            } else if (errorName === 'InsufficientLiquidity' || errorName.includes('InsufficientLiquidity')) {
              errorMessage = 'Insufficient liquidity in the lending pool. Please try a smaller amount.';
              foundError = true;
            } else if (errorName === 'UnsupportedAsset' || errorName.includes('UnsupportedAsset')) {
              errorMessage = 'This asset is not supported for borrowing.';
              foundError = true;
            } else if (errorName === 'InvalidAmount' || errorName.includes('InvalidAmount')) {
              errorMessage = 'Invalid borrow amount. Please check the amount and try again.';
              foundError = true;
            } else if (errorName === 'BorrowFailed' || errorName.includes('BorrowFailed')) {
              errorMessage = 'Borrow operation failed. Please try again.';
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
            errorMessage = 'Insufficient balance in BalanceManager for this borrow operation.';
          } else if (fullMessage.includes('InsufficientCollateral')) {
            errorMessage = 'Insufficient collateral. Please deposit more collateral before borrowing.';
          } else if (fullMessage.includes('InsufficientLiquidity')) {
            errorMessage = 'Insufficient liquidity in the lending pool. Please try a smaller amount.';
          } else if (fullMessage.includes('UnsupportedAsset')) {
            errorMessage = 'This asset is not supported for borrowing.';
          } else if (fullMessage.includes('InvalidAmount')) {
            errorMessage = 'Invalid borrow amount. Please check the amount and try again.';
          } else if (fullMessage.includes('BorrowFailed')) {
            errorMessage = 'Borrow operation failed. Please try again.';
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
      setCurrentStep(BorrowStep.BORROWING);
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      console.log( 'Transaction submitted',);
      setHash(txHash);

      // 7. Wait for confirmation
      setCurrentStep(BorrowStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      setReceipt(txReceipt);

      // 8. Check transaction status
      if (txReceipt.status === 'reverted') {
        console.error( 'Transaction failed on-chain',);

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

      console.log( 'Transaction confirmed',);
      setCurrentStep(BorrowStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(BorrowStep.ERROR);
      console.error('Transaction failed');
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain]);

  const borrow = async ({
    tokenAddress,
    amount,
    decimals,
  }: BorrowParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(BorrowStep.VALIDATING);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        const error = new Error('Please connect your wallet first');
        console.error('Wallet not connected', {}, 'borrow', 'useBorrow.ts');
        throw error;
      }

      // Validate inputs
      if (!tokenAddress) {
        const error = new Error('Token address is required');
        console.error('Invalid token address', {}, 'borrow', 'useBorrow.ts');
        throw error;
      }

      if (!amount || parseFloat(amount) <= 0) {
        const error = new Error('Invalid amount: must be greater than 0');
        console.error('Invalid amount', {}, 'borrow', 'useBorrow.ts');
        throw error;
      }

      // Prepare addresses and amounts
      const { address: routerAddress } = getRouterAddress();
      const checksumTokenAddress = getAddress(tokenAddress);
      const amountInWei = parseUnits(amount, decimals);

      console.log( `Borrowing ${amount} tokens`);

      // Execute transaction (includes simulation, submission, and confirmation)
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'borrow',
        args: [
          checksumTokenAddress, // Token address
          amountInWei, // Amount
        ],
      });

      console.log( 'Borrow successful',);

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      console.error('Borrow failed');

      setIsPending(false);
      setCurrentStep(BorrowStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    borrow,
    isPending,
    isConfirming,
    isConfirmed: currentStep === BorrowStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt,
    isAuthenticated: ready && authenticated && !!address,
    address,
  };
}

