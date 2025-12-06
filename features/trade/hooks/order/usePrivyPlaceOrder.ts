'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Contracts, ScaleXRouterABI, BalanceManagerABI, PoolManagerABI, OrderBookABI } from '@/configs/contracts';
import { ChainConfig } from '@/configs/chain';

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

export enum OrderStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SIMULATING = 'simulating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
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

// Parse contract error for better error messages
const parseContractError = (error: unknown): Error => {
  if (error instanceof Error) {
    const message = error.message;

    // Extract revert reason from error message
    const revertMatch = message.match(/reverted with reason string '([^']+)'/);
    if (revertMatch) {
      return new Error(revertMatch[1]);
    }

    // Check for specific orderbook errors
    if (message.includes('OrderHasNoLiquidity')) {
      return new Error('No liquidity available to fill this order. Try a smaller quantity or place a limit order instead.');
    }
    if (message.includes('OrderTooSmall')) {
      return new Error('Order quantity is below minimum. Try increasing the order size (e.g., 0.1 WETH or more).');
    }
    if (message.includes('OrderTooLarge')) {
      return new Error('Order quantity exceeds maximum. Try reducing the order size.');
    }
    if (message.includes('InsufficientBalanceRequired')) {
      return new Error('Insufficient balance in BalanceManager. Please deposit more funds.');
    }
    if (message.includes('SlippageTooHigh')) {
      return new Error('Price moved too much. Try increasing slippage tolerance or use a limit order.');
    }
    if (message.includes('PostOnlyWouldTake')) {
      return new Error('Post-only order would take liquidity. Adjust price or use a different time-in-force.');
    }

    // Extract common error patterns
    if (message.includes('insufficient funds')) {
      return new Error('Insufficient funds for this transaction');
    }
    if (message.includes('user rejected')) {
      return new Error('Transaction was rejected');
    }

    return error;
  }
  return new Error('An unknown error occurred');
};

interface TradingRules {
  minTradeAmount: bigint;
  minAmountMovement: bigint;
  minPriceMovement: bigint;
  minOrderSize: bigint;
}

interface MarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  depositAmount: string;
  minOutAmount?: string;
  quantityDecimals?: number;
  depositDecimals?: number;
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
  quantityDecimals?: number;
  depositDecimals?: number;
  priceDecimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

export function usePrivyPlaceOrder({ onSuccess, onError }: UsePrivyTradingOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<OrderStep>(OrderStep.IDLE);
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

      // 5. Simulate transaction first to catch errors early
      setCurrentStep(OrderStep.SIMULATING);
      logger.info('Simulating transaction...');

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        logger.success('Transaction simulation successful');
      } catch (simulationError: any) {
        logger.error('Transaction simulation failed', simulationError);

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
            if (errorName === 'OrderHasNoLiquidity' || errorName.includes('OrderHasNoLiquidity')) {
              errorMessage = 'No liquidity available to fill this order. The orderbook is empty or has no matching orders. Try placing a limit order instead.';
              foundError = true;
            } else if (errorName === 'InsufficientSwapBalance' || errorName.includes('InsufficientSwapBalance')) {
              errorMessage = 'Insufficient balance in BalanceManager. Please deposit more funds.';
              foundError = true;
            } else if (errorName === 'OrderTooSmall' || errorName.includes('OrderTooSmall')) {
              // Extract amounts from error if available
              let detailedMessage = 'Order value is below minimum (5 USDC). ';
              if (currentError.data) {
                // Try to extract the amounts from error data
                detailedMessage += 'For limit orders, the total value (quantity × price) must be at least 5 USDC. ';
                detailedMessage += 'Increase either the quantity or the price.';
              } else {
                detailedMessage += 'Try increasing the order size or price.';
              }
              errorMessage = detailedMessage;
              foundError = true;
            } else if (errorName !== 'Error' && errorName !== 'ContractFunctionRevertedError') {
              errorMessage = `Contract error: ${errorName}`;
              foundError = true;
            }
          }

          // Check error data/signature
          if (!foundError && errorData) {
            // Try to decode known error signatures
            if (typeof errorData === 'string') {
              // Check for known error selectors (first 4 bytes of keccak256 of error signature)
              if (errorData.startsWith('0x670f0045')) {
                // InsufficientBalance error - user doesn't have enough in BalanceManager
                errorMessage = 'Insufficient balance in BalanceManager for this order. Please deposit more funds before placing this order.';
                foundError = true;
              } else if (errorData.startsWith('0x')) {
                errorMessage = `Contract reverted with data: ${errorData}`;
                foundError = true;
              }
            }
          }

          // Move to next error in chain
          currentError = currentError.cause;
        }

        // If still no specific error found, check the message for patterns
        if (!foundError) {
          const fullMessage = simulationError.message || simulationError.shortMessage || '';
          if (fullMessage.includes('OrderHasNoLiquidity')) {
            errorMessage = 'No liquidity available to fill this order. The orderbook is empty or has no matching orders. Try placing a limit order instead.';
          } else if (fullMessage.includes('InsufficientSwapBalance')) {
            errorMessage = 'Insufficient balance in BalanceManager. Please deposit more funds.';
          } else if (fullMessage.includes('OrderTooSmall')) {
            errorMessage = 'Order value is below minimum (5 USDC). For limit orders, the total value (quantity × price) must be at least 5 USDC. Increase either the quantity or the price.';
          } else {
            // Generic revert - provide helpful context based on common issues
            errorMessage = 'Transaction simulation failed. Most likely cause: No liquidity in the orderbook (no matching orders available). Other possible causes: insufficient balance or invalid order parameters. Try placing a limit order to add liquidity, or check if there are existing orders in the market.';
          }
        }

        // Log the full error for debugging
        console.error('[PrivyPlaceOrder] Full simulation error:', {
          message: simulationError.message,
          shortMessage: simulationError.shortMessage,
          details: simulationError.details,
          name: simulationError.name,
          cause: simulationError.cause,
          causeName: simulationError.cause?.name,
          causeData: simulationError.cause?.data,
          causeReason: simulationError.cause?.reason,
          causeMetaMessages: simulationError.cause?.metaMessages,
          walk: simulationError.walk ? 'available' : 'not available',
          // Deep dive into cause chain
          causeCause: simulationError.cause?.cause,
          causeCauseName: simulationError.cause?.cause?.name,
        });

        throw new Error(`Transaction will fail: ${errorMessage}`);
      }

      // 6. Execute the contract call
      setCurrentStep(OrderStep.SUBMITTING);
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      logger.success('Transaction submitted', txHash);
      setHash(txHash);

      // 7. Wait for confirmation
      setCurrentStep(OrderStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      setReceipt(txReceipt);

      // 8. Check transaction status
      if (txReceipt.status === 'reverted') {
        logger.error('Transaction failed on-chain');

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

      logger.success('Transaction confirmed', txReceipt.transactionHash);
      setCurrentStep(OrderStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(OrderStep.ERROR);
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
    quantityDecimals = 18,
    depositDecimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: MarketOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(OrderStep.VALIDATING);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        const error = new Error('Please connect your wallet first');
        logger.error('Wallet not connected');
        throw error;
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        const error = new Error('Invalid pool: base and quote addresses are required');
        logger.error('Invalid pool configuration');
        throw error;
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        const error = new Error('Invalid quantity: must be greater than 0');
        logger.error('Invalid quantity');
        throw error;
      }

      // Allow zero deposit amount for market orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        const error = new Error('Invalid deposit amount: cannot be negative');
        logger.error('Invalid deposit amount');
        throw error;
      }

      // Prepare addresses and amounts
      // IMPORTANT: quantity is always in base currency, depositAmount is in deposit currency
      const { address: routerAddress } = getRouterAddress();
      const checksumBaseAddress = getAddress(pool.base);
      const checksumQuoteAddress = getAddress(pool.quote);
      const quantityInWei = parseUnits(quantity, quantityDecimals);
      const depositAmountInWei = depositAmount ? parseUnits(depositAmount, depositDecimals) : 0n;
      const minOutAmountInWei = parseUnits(minOutAmount, quantityDecimals);

      logger.info(`Placing market ${side === OrderSide.BUY ? 'buy' : 'sell'} order for ${quantity} tokens`);

      // Create wallet client for validation checks (reused for trading rules and balance checks)
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(ChainConfig.defaultChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // Fetch and validate trading rules
      try {
        // Get pool manager address
        const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

        // Get pool key
        const poolKey = await walletClient.readContract({
          address: poolManagerAddress,
          abi: PoolManagerABI,
          functionName: 'createPoolKey',
          args: [checksumBaseAddress, checksumQuoteAddress],
        }) as any;

        // Get pool (which includes orderBook address)
        const poolData = await walletClient.readContract({
          address: poolManagerAddress,
          abi: PoolManagerABI,
          functionName: 'getPool',
          args: [poolKey],
        }) as any;

        const orderBookAddress = poolData.orderBook as `0x${string}`;

        // Get trading rules from orderbook
        const tradingRules = await walletClient.readContract({
          address: orderBookAddress,
          abi: OrderBookABI,
          functionName: 'getTradingRules',
        }) as TradingRules;

        logger.info('Trading rules fetched', {
          minOrderSize: formatUnits(tradingRules.minOrderSize, quantityDecimals),
          minTradeAmount: formatUnits(tradingRules.minTradeAmount, quantityDecimals),
        });

        // Validate order against trading rules
        if (quantityInWei < tradingRules.minOrderSize) {
          throw new Error(
            `Order quantity (${formatUnits(quantityInWei, quantityDecimals)}) is below minimum order size ` +
            `(${formatUnits(tradingRules.minOrderSize, quantityDecimals)}). Please increase your order size.`
          );
        }

        if (quantityInWei < tradingRules.minTradeAmount) {
          throw new Error(
            `Order quantity (${formatUnits(quantityInWei, quantityDecimals)}) is below minimum trade amount ` +
            `(${formatUnits(tradingRules.minTradeAmount, quantityDecimals)}). Please increase your order size.`
          );
        }

        // Check if quantity is a multiple of minAmountMovement
        if (tradingRules.minAmountMovement > 0n && quantityInWei % tradingRules.minAmountMovement !== 0n) {
          logger.warning(
            `Order quantity should be a multiple of ${formatUnits(tradingRules.minAmountMovement, quantityDecimals)}`
          );
        }

        logger.success('Order validation passed');
      } catch (error: any) {
        if (error.message.includes('minimum')) {
          throw error; // Re-throw validation errors
        }
        logger.warning('Could not validate trading rules, proceeding anyway', error);
        // Continue if we can't fetch rules
      }

      // Check orderbook liquidity before placing market order
      try {
        // Use Router's getBestPrice function to check liquidity
        const routerAddress = Contracts[ChainConfig.defaultChainId].scaleXRouterAddress;

        // For BUY orders, check if there are sell orders (asks) - use Side.SELL
        // For SELL orders, check if there are buy orders (bids) - use Side.BUY
        const querySide = side === OrderSide.BUY ? 1 : 0; // 1 = SELL (ask), 0 = BUY (bid)

        try {
          // Call router.getBestPrice(baseCurrency, quoteCurrency, side)
          // Returns PriceVolume struct with price and volume
          const priceVolume = await walletClient.readContract({
            address: routerAddress,
            abi: [{
              "inputs": [
                { "internalType": "address", "name": "baseCurrency", "type": "address" },
                { "internalType": "address", "name": "quoteCurrency", "type": "address" },
                { "internalType": "uint8", "name": "side", "type": "uint8" }
              ],
              "name": "getBestPrice",
              "outputs": [{
                "components": [
                  { "internalType": "uint128", "name": "price", "type": "uint128" },
                  { "internalType": "uint128", "name": "volume", "type": "uint128" }
                ],
                "internalType": "struct IOrderBook.PriceVolume",
                "name": "",
                "type": "tuple"
              }],
              "stateMutability": "view",
              "type": "function"
            }],
            functionName: 'getBestPrice',
            args: [checksumBaseAddress, checksumQuoteAddress, querySide],
          }) as any;

          const bestPrice = priceVolume.price as bigint;
          const volume = priceVolume.volume as bigint;

          if (bestPrice === 0n || volume === 0n) {
            throw new Error('No liquidity');
          }

          // Price is in quote currency (USDC = 6 decimals), volume is in base currency (WETH = 18 decimals)
          logger.info(`Orderbook has liquidity. Best ${side === OrderSide.BUY ? 'ask' : 'bid'}: ${formatUnits(bestPrice, depositDecimals)} ${side === OrderSide.BUY ? 'quote' : 'quote'} currency, Volume: ${formatUnits(volume, quantityDecimals)} base currency`);
        } catch (liquidityError: any) {
          // getBestPrice reverts when orderbook is empty
          const orderType = side === OrderSide.BUY ? 'sell' : 'buy';
          throw new Error(
            `No liquidity available in orderbook. There are no ${orderType} orders to match against. ` +
            `Please place a limit order first, or wait for other traders to add liquidity.`
          );
        }
      } catch (error: any) {
        if (error.message.includes('liquidity') || error.message.includes('orders')) {
          throw error; // Re-throw liquidity errors
        }
        logger.warning('Could not check orderbook liquidity', error);
        // Continue anyway - simulation will catch it
      }

      // Check user's BalanceManager balance before placing order
      // (walletClient already created above)

      // Determine which currency user needs based on order side
      const requiredCurrency = side === OrderSide.BUY ? checksumQuoteAddress : checksumBaseAddress;
      const requiredCurrencySymbol = side === OrderSide.BUY ? 'quote currency' : 'base currency';
      // Use correct decimals for the required currency
      const requiredCurrencyDecimals = side === OrderSide.BUY ? depositDecimals : quantityDecimals;

      // Get BalanceManager address
      const balanceManagerAddress = Contracts[ChainConfig.defaultChainId].balanceManagerAddress;

      // Check balance in BalanceManager
      try {
        const balance = await walletClient.readContract({
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'getBalance',
          args: [address as `0x${string}`, requiredCurrency],
        }) as bigint;

        logger.info(`BalanceManager balance: ${formatUnits(balance, requiredCurrencyDecimals)} ${requiredCurrencySymbol}`);

        if (balance === 0n) {
          throw new Error(`No ${requiredCurrencySymbol} balance in BalanceManager. Please deposit first.`);
        }

        // For BUY orders, we can't validate exact balance needed without knowing execution price
        // But we check if there's any balance at all
        // For SELL orders, we need at least the quantity amount
        if (side === OrderSide.SELL && balance < quantityInWei) {
          throw new Error(
            `Insufficient ${requiredCurrencySymbol} balance. ` +
            `Required: ${formatUnits(quantityInWei, quantityDecimals)}, ` +
            `Available: ${formatUnits(balance, quantityDecimals)}`
          );
        }
      } catch (error: any) {
        if (error.message.includes('balance')) {
          throw error; // Re-throw our balance check errors
        }
        logger.warning('Could not check BalanceManager balance', error);
        // Continue anyway - let the contract check
      }

      // Get orderBook address from PoolManager
      const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

      // Create pool key
      const poolKey = await walletClient.readContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: 'createPoolKey',
        args: [checksumBaseAddress, checksumQuoteAddress],
      }) as any;

      // Get pool data (which includes orderBook address)
      const poolData = await walletClient.readContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: 'getPool',
        args: [poolKey],
      }) as any;

      const orderBookAddress = poolData.orderBook as `0x${string}`;
      logger.info(`Using orderBook: ${orderBookAddress}`);

      // Execute transaction (includes simulation, submission, and confirmation)
      // Pool parameter is [baseCurrency, quoteCurrency, orderBook] - NOT {base, quote, spacing, fee}!
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeMarketOrder',
        args: [
          [checksumBaseAddress, checksumQuoteAddress, orderBookAddress], // Pool as array of 3 addresses
          BigInt(quantityInWei.toString()),
          side,
          BigInt(depositAmountInWei.toString()),
          BigInt(minOutAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
      });

      logger.success('Market order placed successfully', txHash);

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.error('Market order failed', parsedError.message);

      setIsPending(false);
      setCurrentStep(OrderStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  const placeLimitOrder = async ({
    pool,
    price,
    quantity,
    side,
    timeInForce,
    depositAmount,
    quantityDecimals = 18,
    depositDecimals = 18,
    priceDecimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: LimitOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(OrderStep.VALIDATING);

      // Validate authentication
      if (!ready || !authenticated || !embeddedWallet || !address) {
        const error = new Error('Please connect your wallet first');
        logger.error('Wallet not connected');
        throw error;
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        const error = new Error('Invalid pool: base and quote addresses are required');
        logger.error('Invalid pool configuration');
        throw error;
      }

      if (!price || parseFloat(price) <= 0) {
        const error = new Error('Invalid price: must be greater than 0');
        logger.error('Invalid price');
        throw error;
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        const error = new Error('Invalid quantity: must be greater than 0');
        logger.error('Invalid quantity');
        throw error;
      }

      // Allow zero deposit amount for limit orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        const error = new Error('Invalid deposit amount: cannot be negative');
        logger.error('Invalid deposit amount');
        throw error;
      }

      // Prepare addresses and amounts
      // IMPORTANT: quantity and price are in base currency, depositAmount is in deposit currency
      const { address: routerAddress } = getRouterAddress();
      const checksumBaseAddress = getAddress(pool.base);
      const checksumQuoteAddress = getAddress(pool.quote);
      const priceInWei = parseUnits(price, priceDecimals);
      const quantityInWei = parseUnits(quantity, quantityDecimals);
      const depositAmountInWei = depositAmount ? parseUnits(depositAmount, depositDecimals) : 0n;

      logger.info(`Placing limit ${side === OrderSide.BUY ? 'buy' : 'sell'} order for ${quantity} tokens at price ${price}`);

      // Create wallet client for validation checks (reused for trading rules and balance checks)
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(ChainConfig.defaultChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // Fetch and validate trading rules
      try {
        // Get pool manager address
        const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

        // Get pool key
        const poolKey = await walletClient.readContract({
          address: poolManagerAddress,
          abi: PoolManagerABI,
          functionName: 'createPoolKey',
          args: [checksumBaseAddress, checksumQuoteAddress],
        }) as any;

        // Get pool (which includes orderBook address)
        const poolData = await walletClient.readContract({
          address: poolManagerAddress,
          abi: PoolManagerABI,
          functionName: 'getPool',
          args: [poolKey],
        }) as any;

        const orderBookAddress = poolData.orderBook as `0x${string}`;

        // Get trading rules from orderbook
        const tradingRules = await walletClient.readContract({
          address: orderBookAddress,
          abi: OrderBookABI,
          functionName: 'getTradingRules',
        }) as TradingRules;

        logger.info('Trading rules fetched', {
          minOrderSize: formatUnits(tradingRules.minOrderSize, quantityDecimals),
          minTradeAmount: formatUnits(tradingRules.minTradeAmount, quantityDecimals),
          minPriceMovement: formatUnits(tradingRules.minPriceMovement, priceDecimals),
        });

        // Validate order against trading rules
        // For limit orders, minOrderSize is the minimum order VALUE (quantity × price), not just quantity
        // Calculate order value in quote currency
        const orderValue = (quantityInWei * priceInWei) / (10n ** BigInt(quantityDecimals));

        if (orderValue < tradingRules.minOrderSize) {
          const minValueInQuote = formatUnits(tradingRules.minOrderSize, priceDecimals);
          const currentValueInQuote = formatUnits(orderValue, priceDecimals);
          throw new Error(
            `Order value (${currentValueInQuote} quote currency) is below minimum (${minValueInQuote} quote currency). ` +
            `For limit orders, quantity × price must be at least ${minValueInQuote}. ` +
            `Increase either the quantity or the price.`
          );
        }

        if (orderValue < tradingRules.minTradeAmount) {
          const minValueInQuote = formatUnits(tradingRules.minTradeAmount, priceDecimals);
          const currentValueInQuote = formatUnits(orderValue, priceDecimals);
          throw new Error(
            `Order value (${currentValueInQuote} quote currency) is below minimum trade amount (${minValueInQuote} quote currency). ` +
            `Increase either the quantity or the price.`
          );
        }

        // Check if quantity is a multiple of minAmountMovement
        if (tradingRules.minAmountMovement > 0n && quantityInWei % tradingRules.minAmountMovement !== 0n) {
          logger.warning(
            `Order quantity should be a multiple of ${formatUnits(tradingRules.minAmountMovement, quantityDecimals)}`
          );
        }

        // Check if price is a multiple of minPriceMovement
        if (tradingRules.minPriceMovement > 0n && priceInWei % tradingRules.minPriceMovement !== 0n) {
          logger.warning(
            `Order price should be a multiple of ${formatUnits(tradingRules.minPriceMovement, priceDecimals)}`
          );
        }

        logger.success('Order validation passed');
      } catch (error: any) {
        if (error.message.includes('minimum')) {
          throw error; // Re-throw validation errors
        }
        logger.warning('Could not validate trading rules, proceeding anyway', error);
        // Continue if we can't fetch rules
      }

      // Check user's BalanceManager balance for limit orders
      // For limit orders, user must have the required currency already deposited (depositAmount = 0)
      try {
        const balanceManagerAddress = Contracts[ChainConfig.defaultChainId].balanceManagerAddress;

        const orderValue = (quantityInWei * priceInWei) / (10n ** BigInt(quantityDecimals));


        // For BUY orders, we need quote currency (USDC) = order value (quantity × price)
        // For SELL orders, we need base currency (WETH) = quantity
        const requiredCurrency = side === OrderSide.BUY ? checksumQuoteAddress : checksumBaseAddress;
        const requiredAmount = side === OrderSide.BUY ? orderValue : quantityInWei;
        const currencyDecimals = side === OrderSide.BUY ? priceDecimals : quantityDecimals;
        const currencySymbol = side === OrderSide.BUY ? 'quote' : 'base';

        const balance = await walletClient.readContract({
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'getBalance',
          args: [address as `0x${string}`, requiredCurrency],
        }) as bigint;

        logger.info(`BalanceManager ${currencySymbol} currency balance: ${formatUnits(balance, currencyDecimals)}`);

        if (balance < requiredAmount) {
          throw new Error(
            `Insufficient ${currencySymbol} currency balance in BalanceManager. ` +
            `Required: ${formatUnits(requiredAmount, currencyDecimals)}, ` +
            `Available: ${formatUnits(balance, currencyDecimals)}. ` +
            `Please deposit more funds before placing this order.`
          );
        }
      } catch (error: any) {
        if (error.message.includes('Insufficient') || error.message.includes('balance')) {
          throw error; // Re-throw balance errors
        }
        logger.warning('Could not check BalanceManager balance', error);
        // Continue anyway - simulation will catch it
      }

      // Get orderBook address from PoolManager
      const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

      // Create pool key
      const poolKey = await walletClient.readContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: 'createPoolKey',
        args: [checksumBaseAddress, checksumQuoteAddress],
      }) as any;

      // Get pool data (which includes orderBook address)
      const poolData = await walletClient.readContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: 'getPool',
        args: [poolKey],
      }) as any;

      const orderBookAddress = poolData.orderBook as `0x${string}`;
      logger.info(`Using orderBook: ${orderBookAddress}`);

      // Execute transaction (includes simulation, submission, and confirmation)
      // Pool parameter is [baseCurrency, quoteCurrency, orderBook] - NOT {base, quote, spacing, fee}!
      // Note: Using 6-param version like MM bot (no autoRepay/autoBorrow) - the 8-param version may not be implemented
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeLimitOrder',
        args: [
          [checksumBaseAddress, checksumQuoteAddress, orderBookAddress], // Pool as array of 3 addresses
          BigInt(priceInWei.toString()),
          BigInt(quantityInWei.toString()),
          side,
          timeInForce,
          BigInt(depositAmountInWei.toString())
          // Removed autoRepay and autoBorrow - using 6-param version like MM bot
        ],
      });

      logger.success('Limit order placed successfully', txHash);

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.error('Limit order failed', parsedError.message);

      setIsPending(false);
      setCurrentStep(OrderStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    placeMarketOrder,
    placeLimitOrder,
    isPending,
    isConfirming,
    isConfirmed: currentStep === OrderStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt,
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