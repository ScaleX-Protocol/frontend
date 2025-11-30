'use client';

import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Contracts, ScaleXRouterABI } from '@/configs/contracts';
import { ChainConfig } from '@/configs/chain';
import { useToast } from '@/hooks/useToast';

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

// Minimal logging utility - only essential logs
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[PrivyPlaceOrder] ${message}`);
  },
  success: (message: string, data?: any) => {
    console.log(`[PrivyPlaceOrder] ✓ ${message}`);
  },
  warning: (message: string, data?: any) => {
    console.warn(`[PrivyPlaceOrder] ⚠️ ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`[PrivyPlaceOrder] ❌ ${message}`, error?.message || error);
  },
  debug: () => {
    // Disabled debug logging
  }
};

// Trading enums matching the contract
export enum OrderSide {
  BUY = 0,
  SELL = 1
}

export enum TimeInForce {
  GTC = 0, // Good 'Til Canceled
  IOC = 1, // Immediate Or Cancel
  FOK = 2, // Fill Or Kill
  PO = 3   // Post Only
}

// Pool interface matching IPoolManager.Pool
export interface Pool {
  base: string;
  quote: string;
  spacing: number;
  fee: number;
}

interface UsePrivyTradingOptions {
  onSuccess?: (hash: `0x${string}`, orderId?: number) => void;
  onError?: (error: Error) => void;
}

interface MarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  depositAmount: string;
  minOutAmount?: string;
  decimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

interface LimitOrderParams {
  pool: Pool;
  price: string;
  quantity: string;
  side: OrderSide;
  timeInForce: TimeInForce;
  depositAmount: string;
  decimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

export function usePrivyPlaceOrder({ onSuccess, onError }: UsePrivyTradingOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { toast } = useToast();

  // Get the embedded wallet (first wallet from Privy)
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const address = embeddedWallet?.address || user?.wallet?.address;

  const getRouterAddress = useCallback((chainId?: number) => {
    const targetChainId = chainId || ChainConfig.defaultChainId;
    const chainContracts = ROUTER_ADDRESSES[targetChainId as keyof typeof ROUTER_ADDRESSES];

    if (!chainContracts) {
      const availableChains = Object.keys(ROUTER_ADDRESSES);
      const error = new Error(`ScaleXRouter contract not found on chain ${targetChainId}. Available chains: ${availableChains.join(', ')}`);
      logger.error('ScaleXRouter contract not found');
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
        throw new Error(`Failed to switch to chain ${targetChainId}: ${(error as any).message}`);
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

      // 5. Execute the contract call
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      logger.success('Transaction submitted', txHash);
      setHash(txHash);

      // 6. Wait for confirmation
      setIsConfirming(true);
      const receipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      logger.success('Transaction confirmed', receipt.transactionHash);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      logger.error('Transaction failed', error);
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain]);

  const placeMarketOrder = async ({
    pool,
    quantity,
    side,
    depositAmount,
    minOutAmount = '0',
    decimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: MarketOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        throw new Error('Please connect your wallet first');
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        throw new Error('Invalid pool: base and quote addresses are required');
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Invalid quantity: must be greater than 0');
      }

      // Allow zero deposit amount for market orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        throw new Error('Invalid deposit amount: cannot be negative');
      }

      // Prepare addresses and amounts
      const { address: routerAddress, chainId: targetChainId } = getRouterAddress();
      const quantityInWei = parseUnits(quantity, decimals);
      const depositAmountInWei = depositAmount ? parseUnits(depositAmount, decimals) : 0n;
      const minOutAmountInWei = parseUnits(minOutAmount, decimals);

      // Execute transaction
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeMarketOrder',
        args: [
          {
            base: getAddress(pool.base),
            quote: getAddress(pool.quote),
            spacing: pool.spacing,
            fee: pool.fee
          },
          BigInt(quantityInWei.toString()),
          side,
          BigInt(depositAmountInWei.toString()),
          BigInt(minOutAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
      });

      logger.success('Market order placed successfully', txHash);

      // Show success toast
      toast({
        title: 'Market Order Placed Successfully!',
        description: `${side === OrderSide.BUY ? 'Buy' : 'Sell'} order for ${quantity} ${side === OrderSide.BUY ? 'WETH' : 'WETH'} has been submitted.`,
        variant: 'success',
        duration: 5000,
      });

      setIsPending(false);
      setError(null);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      logger.error('Market order failed', error.message);

      // Show error toast
      toast({
        title: 'Market Order Failed',
        description: error.message || 'An unexpected error occurred while placing your order.',
        variant: 'destructive',
        duration: 7000,
      });

      setIsPending(false);
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  const placeLimitOrder = async ({
    pool,
    price,
    quantity,
    side,
    timeInForce,
    depositAmount,
    decimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: LimitOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        throw new Error('Please connect your wallet first');
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        throw new Error('Invalid pool: base and quote addresses are required');
      }

      if (!price || parseFloat(price) <= 0) {
        throw new Error('Invalid price: must be greater than 0');
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Invalid quantity: must be greater than 0');
      }

      // Allow zero deposit amount for limit orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        throw new Error('Invalid deposit amount: cannot be negative');
      }

      // Prepare addresses and amounts
      const { address: routerAddress, chainId: targetChainId } = getRouterAddress();
      const priceInWei = parseUnits(price, decimals);
      const quantityInWei = parseUnits(quantity, decimals);
      const depositAmountInWei = depositAmount ? parseUnits(depositAmount, decimals) : 0n;

      // Execute transaction
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeLimitOrder',
        args: [
          {
            base: getAddress(pool.base),
            quote: getAddress(pool.quote),
            spacing: pool.spacing,
            fee: pool.fee
          },
          BigInt(priceInWei.toString()),
          BigInt(quantityInWei.toString()),
          side,
          timeInForce,
          BigInt(depositAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
      });

      logger.success('Limit order placed successfully', txHash);

      // Show success toast
      toast({
        title: 'Limit Order Placed Successfully!',
        description: `${side === OrderSide.BUY ? 'Buy' : 'Sell'} limit order for ${quantity} WETH at ${price} USDC has been submitted.`,
        variant: 'success',
        duration: 5000,
      });

      setIsPending(false);
      setError(null);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      logger.error('Limit order failed', error.message);

      // Show error toast
      toast({
        title: 'Limit Order Failed',
        description: error.message || 'An unexpected error occurred while placing your order.',
        variant: 'destructive',
        duration: 7000,
      });

      setIsPending(false);
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  return {
    placeMarketOrder,
    placeLimitOrder,
    isPending,
    isConfirming,
    isConfirmed: false, // Will be true after transaction is confirmed
    error,
    hash,
    isAuthenticated: ready && authenticated && !!address,
    address,
  };
}

// Utility function to format token amount for display
export function formatTokenAmount(amount: bigint | undefined, decimals: number): string {
  if (!amount) return '0';
  return formatUnits(amount, decimals);
}

// Utility function to get side label
export function getSideLabel(side: OrderSide): string {
  return side === OrderSide.BUY ? 'Buy' : 'Sell';
}

// Utility function to getTimeInForceLabel
export function getTimeInForceLabel(timeInForce: TimeInForce): string {
  switch (timeInForce) {
    case TimeInForce.GTC:
      return 'Good \'Til Canceled';
    case TimeInForce.IOC:
      return 'Immediate Or Cancel';
    case TimeInForce.FOK:
      return 'Fill Or Kill';
    case TimeInForce.PO:
      return 'Post Only';
    default:
      return 'Unknown';
  }
}