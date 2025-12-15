'use client';

import { parseContractError } from '../../utils/tradingUtils';
import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Contracts, ScaleXRouterABI } from '@scalex/service-wallet';
import { ChainConfig } from '@scalex/service-wallet';
import { useLogger } from '../useLogger';
import { LogLevel, LogLabel, ServiceName } from '../../utils/logger';
import { logger } from '../../utils/prodLogger';

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

export enum SwapStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  CALCULATING = 'calculating',
  SIMULATING = 'simulating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UsePrivySwapOptions {
  onSuccess?: (hash: `0x${string}`, receivedAmount?: bigint) => void;
  onError?: (error: Error) => void;
}

interface SwapParams {
  srcToken: string;
  dstToken: string;
  srcAmount: string;
  srcDecimals?: number;
  dstDecimals?: number;
  slippageToleranceBps?: number; // In basis points (100 = 1%)
  maxHops?: number;
  minDstAmount?: string; // Optional manual override
  depositAmount?: string; // Amount to deposit from wallet (defaults to '0' to use existing balance)
  keepInBalance?: boolean; // If true, keeps output in BalanceManager (defaults to true)
  user?: string; // User address to execute swap for (defaults to embedded wallet address)
}

const log = logger.withContext({ hook: 'usePrivySwap' });

export function usePrivySwap({ onSuccess, onError }: UsePrivySwapOptions = {}) {
  const logger = useLogger();

  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<SwapStep>(SwapStep.IDLE);
  const [receipt, setReceipt] = useState<unknown | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

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
      logger.logError('ScaleXRouter contract not found', { targetChainId, availableChains }, 'getRouterAddress', 'usePrivySwap.ts');
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
    } catch {
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
        throw new Error(`Failed to switch to chain ${targetChainId}: ${(addError as Error).message}`);
      }
    }
  }, [embeddedWallet]);

  const executeTransaction = useCallback(async (contractCall: { address: `0x${string}`; abi: any; functionName: string; args: any[] }) => {
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
      setCurrentStep(SwapStep.SIMULATING);
      logger.log(LogLevel.INFO, 'Simulating swap transaction...', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivySwap.ts', 'executeTransaction');

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        logger.log(LogLevel.INFO, 'Swap simulation successful', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivySwap.ts', 'executeTransaction');
      } catch (simulationError: unknown) {
        const error = simulationError as any;
        logger.logError('Swap simulation failed', { error: error.message || error }, 'executeTransaction', 'usePrivySwap.ts');

        // Try to extract detailed error information
        let errorMessage = 'Unknown reason';
        let currentError = error;
        let foundError = false;

        // Walk through error chain to find root cause
        while (currentError && !foundError) {
          const errorName = currentError.name || currentError.cause?.name;

          if (errorName && errorName !== 'ContractFunctionRevertedError') {
            if (errorName === 'NoValidSwapPath' || errorName.includes('NoValidSwapPath')) {
              errorMessage = 'No valid swap path found between these tokens. There may not be sufficient liquidity or a direct/indirect trading pair.';
              foundError = true;
            } else if (errorName === 'InsufficientSwapBalance' || errorName.includes('InsufficientSwapBalance')) {
              errorMessage = 'Insufficient balance for swap. Please ensure you have enough tokens deposited.';
              foundError = true;
            } else if (errorName === 'SlippageTooHigh' || errorName.includes('SlippageTooHigh')) {
              errorMessage = 'Slippage tolerance exceeded. The price moved unfavorably. Try increasing slippage tolerance or reducing swap amount.';
              foundError = true;
            } else if (errorName === 'IdenticalCurrencies' || errorName.includes('IdenticalCurrencies')) {
              errorMessage = 'Cannot swap identical tokens. Source and destination tokens must be different.';
              foundError = true;
            } else if (errorName === 'TooManyHops' || errorName.includes('TooManyHops')) {
              errorMessage = 'Swap route requires too many hops. Try a different token pair or adjust maxHops parameter.';
              foundError = true;
            } else if (errorName !== 'Error' && errorName !== 'ContractFunctionRevertedError') {
              errorMessage = `Contract error: ${errorName}`;
              foundError = true;
            }
          }

          currentError = currentError.cause;
        }

        // Check message for patterns if no specific error found
        if (!foundError) {
          const fullMessage = error.message || error.shortMessage || '';
          if (fullMessage.includes('NoValidSwapPath')) {
            errorMessage = 'No valid swap path found between these tokens. There may not be sufficient liquidity or a direct/indirect trading pair.';
          } else if (fullMessage.includes('InsufficientSwapBalance')) {
            errorMessage = 'Insufficient balance for swap. Please ensure you have enough tokens deposited.';
          } else if (fullMessage.includes('SlippageTooHigh')) {
            errorMessage = 'Slippage tolerance exceeded. The price moved unfavorably. Try increasing slippage tolerance or reducing swap amount.';
          } else {
            errorMessage = 'Swap simulation failed. Possible causes: insufficient liquidity, no trading path available, or insufficient balance. Please verify token pair and try again.';
          }
        }

        // Log full error for debugging
        log.error('Full swap simulation error details', {
          message: error.message,
          shortMessage: error.shortMessage,
          details: error.details,
          name: error.name,
          cause: error.cause,
        });

        throw new Error(`Swap will fail: ${errorMessage}`);
      }

      // 6. Execute the contract call
      setCurrentStep(SwapStep.SUBMITTING);
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      logger.log(LogLevel.INFO, 'Swap transaction submitted', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivySwap.ts', 'executeTransaction');
      setHash(txHash);

      // 7. Wait for confirmation
      setCurrentStep(SwapStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      setReceipt(txReceipt);

      // 8. Check transaction status
      if (txReceipt.status === 'reverted') {
        logger.log(LogLevel.ERROR, 'Swap transaction failed on-chain', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivySwap.ts', 'executeTransaction');

        // Try to get the revert reason
        const getRevertReason = async () => {
          try {
            const tx = await walletClient.getTransaction({
              hash: txHash as `0x${string}`
            });

            if (!tx) return 'Transaction not found';

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
        throw new Error(`Swap failed: ${revertReason}`);
      }

      logger.log(LogLevel.INFO, 'Swap transaction confirmed', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash: txReceipt.transactionHash }, 'usePrivySwap.ts', 'executeTransaction');
      setCurrentStep(SwapStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(SwapStep.ERROR);
      logger.logError('Swap transaction failed', { error: error instanceof Error ? error.message : String(error) }, 'executeTransaction', 'usePrivySwap.ts');
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain, logger]);

  const executeSwap = async ({
    srcToken,
    dstToken,
    srcAmount,
    srcDecimals = 18,
    dstDecimals = 18,
    slippageToleranceBps = 100, // Default 1%
    maxHops = 2,
    minDstAmount,
    depositAmount = '0', // Default to 0 (use existing balance)
    keepInBalance = true, // Default to true (keep output in BalanceManager)
    user // Default to embedded wallet address
  }: SwapParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setEstimatedOutput(null);
      setCurrentStep(SwapStep.VALIDATING);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        const error = new Error('Please connect your wallet first');
        logger.logError('Wallet not connected', {}, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      // Validate inputs
      if (!srcToken || !dstToken) {
        const error = new Error('Invalid tokens: source and destination token addresses are required');
        logger.logError('Invalid token addresses', {}, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      if (srcToken.toLowerCase() === dstToken.toLowerCase()) {
        const error = new Error('Cannot swap identical tokens');
        logger.logError('Identical tokens', { srcToken, dstToken }, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      if (!srcAmount || parseFloat(srcAmount) <= 0) {
        const error = new Error('Invalid amount: must be greater than 0');
        logger.logError('Invalid amount', { srcAmount }, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      if (slippageToleranceBps < 0 || slippageToleranceBps > 10000) {
        const error = new Error('Invalid slippage tolerance: must be between 0 and 10000 (0-100%)');
        logger.logError('Invalid slippage', { slippageToleranceBps }, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      if (maxHops < 1 || maxHops > 3) {
        const error = new Error('Invalid maxHops: must be between 1 and 3');
        logger.logError('Invalid maxHops', { maxHops }, 'executeSwap', 'usePrivySwap.ts');
        throw error;
      }

      // Prepare addresses and amounts
      const { address: routerAddress } = getRouterAddress();
      const checksumSrcAddress = getAddress(srcToken);
      const checksumDstAddress = getAddress(dstToken);
      const srcAmountInWei = parseUnits(srcAmount, srcDecimals);
      const depositAmountInWei = parseUnits(depositAmount, srcDecimals);

      // Use provided user address or default to embedded wallet
      const userAddress = user ? getAddress(user) : (address as `0x${string}`);

      logger.log(LogLevel.INFO, `Executing swap: ${srcAmount} ${checksumSrcAddress} -> ${checksumDstAddress}`, LogLabel.TRADING, ServiceName.TRADING_UI, { srcAmount, slippageToleranceBps, depositAmount, keepInBalance, user: userAddress }, 'usePrivySwap.ts', 'executeSwap');

      // Create wallet client for validation checks
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(ChainConfig.defaultChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // Check user's wallet balance only if depositAmount > 0
      // When depositAmount is 0, tokens come from BalanceManager, not wallet
      if (depositAmountInWei > 0n) {
        try {
          // For native token, check ETH balance
          if (checksumSrcAddress === '0x0000000000000000000000000000000000000000') {
            const balance = await walletClient.getBalance({
              address: address as `0x${string}`
            });

            logger.log(LogLevel.INFO, `Wallet native balance: ${formatUnits(balance, srcDecimals)}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { balance }, 'usePrivySwap.ts', 'executeSwap');

            if (balance < depositAmountInWei) {
              throw new Error(
                `Insufficient native token balance. Required: ${formatUnits(depositAmountInWei, srcDecimals)}, Available: ${formatUnits(balance, srcDecimals)}`
              );
            }
          } else {
            // For ERC20 tokens, check token balance
            const balance = await walletClient.readContract({
              address: checksumSrcAddress,
              abi: [{
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
              }],
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            }) as bigint;

            logger.log(LogLevel.INFO, `Wallet token balance: ${formatUnits(balance, srcDecimals)}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { balance }, 'usePrivySwap.ts', 'executeSwap');

            if (balance < depositAmountInWei) {
              throw new Error(
                `Insufficient token balance. Required: ${formatUnits(depositAmountInWei, srcDecimals)}, Available: ${formatUnits(balance, srcDecimals)}`
              );
            }
          }
        } catch (error: unknown) {
          const err = error as any;
          if (err.message?.includes('Insufficient')) {
            throw error; // Re-throw balance errors
          }
          logger.log(LogLevel.WARN, 'Could not check wallet balance', LogLabel.BALANCE, ServiceName.TRADING_UI, { error: err.message || err }, 'usePrivySwap.ts', 'executeSwap');
          // Continue anyway - simulation will catch it
        }
      } else {
        logger.log(LogLevel.INFO, 'Using BalanceManager balance (depositAmount = 0)', LogLabel.BALANCE, ServiceName.TRADING_UI, {}, 'usePrivySwap.ts', 'executeSwap');
      }

      // Calculate minimum output amount if not provided
      setCurrentStep(SwapStep.CALCULATING);
      let minDstAmountInWei: bigint;

      if (minDstAmount) {
        minDstAmountInWei = parseUnits(minDstAmount, dstDecimals);
        logger.log(LogLevel.INFO, `Using provided minDstAmount: ${minDstAmount}`, LogLabel.TRADING, ServiceName.TRADING_UI, { minDstAmount }, 'usePrivySwap.ts', 'executeSwap');
      } else {
        try {
          // Call router's calculateMinOutForSwap function
          const calculatedMinOut = await walletClient.readContract({
            address: routerAddress,
            abi: ScaleXRouterABI,
            functionName: 'calculateMinOutForSwap',
            args: [checksumSrcAddress, checksumDstAddress, srcAmountInWei, BigInt(slippageToleranceBps)],
          }) as bigint;

          minDstAmountInWei = calculatedMinOut;
          const estimatedOutputFormatted = formatUnits(calculatedMinOut, dstDecimals);
          setEstimatedOutput(estimatedOutputFormatted);

          logger.log(LogLevel.INFO, `Calculated minDstAmount: ${estimatedOutputFormatted}`, LogLabel.TRADING, ServiceName.TRADING_UI, { minDstAmount: estimatedOutputFormatted, slippageToleranceBps }, 'usePrivySwap.ts', 'executeSwap');

          if (calculatedMinOut === 0n) {
            throw new Error('Cannot calculate minimum output. No valid swap path or insufficient liquidity available.');
          }
        } catch (error: unknown) {
          const err = error as any;
          logger.logError('Failed to calculate minimum output', { error: err.message || err }, 'executeSwap', 'usePrivySwap.ts');
          throw new Error(`Cannot calculate swap output: ${err.message || 'No liquidity or valid path available'}`);
        }
      }

      // Execute transaction (includes simulation, submission, and confirmation)
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'swap',
        args: [
          checksumSrcAddress,
          checksumDstAddress,
          srcAmountInWei,
          minDstAmountInWei,
          maxHops,
          userAddress,
          depositAmountInWei,
          keepInBalance
        ],
      });

      logger.log(LogLevel.INFO, 'Swap executed successfully', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivySwap.ts', 'executeSwap');

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Swap failed', { error: parsedError.message || parsedError }, 'executeSwap', 'usePrivySwap.ts');

      setIsPending(false);
      setCurrentStep(SwapStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    executeSwap,
    isPending,
    isConfirming,
    isConfirmed: currentStep === SwapStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt,
    estimatedOutput,
    isAuthenticated: ready && authenticated && !!address,
    address,
  };
}

// Utility function to format swap step label
export function getSwapStepLabel(step: SwapStep): string {
  switch (step) {
    case SwapStep.IDLE:
      return 'Ready';
    case SwapStep.VALIDATING:
      return 'Validating';
    case SwapStep.CALCULATING:
      return 'Calculating';
    case SwapStep.SIMULATING:
      return 'Simulating';
    case SwapStep.SUBMITTING:
      return 'Submitting';
    case SwapStep.CONFIRMING:
      return 'Confirming';
    case SwapStep.COMPLETED:
      return 'Completed';
    case SwapStep.ERROR:
      return 'Error';
    default:
      return 'Unknown';
  }
}
