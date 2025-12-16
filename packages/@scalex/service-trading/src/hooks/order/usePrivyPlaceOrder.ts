'use client';

import { ChainConfig } from '@scalex/service-wallet';
import { BalanceManagerABI, Contracts, OrderBookABI, PoolManagerABI, ScaleXRouterABI } from '@scalex/service-wallet';
import { useLogger } from '../useLogger';
import { LogLabel, LogLevel, ServiceName } from '../../utils/logger';
import { logger } from '../../utils/prodLogger';
import { parseContractError } from '../../utils/tradingUtils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { createInterceptedWalletClient, getViemChain, waitForTransactionWithLogging } from '../../lib/viemClient';

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

const log = logger().withContext({ hook: 'usePrivyPlaceOrder' });

export function usePrivyPlaceOrder({ onSuccess, onError }: UsePrivyTradingOptions = {}) {
  const logger = useLogger();

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
      logger.logError('ScaleXRouter contract not found', { targetChainId, availableChains }, 'getRouterAddress', 'usePrivyPlaceOrder.ts');
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

      // 4. Create intercepted wallet client with automatic logging
      const walletClient = createInterceptedWalletClient(
        provider,
        address as `0x${string}`,
        targetChainId
      );

      // 5. Simulate transaction first to catch errors early
      setCurrentStep(OrderStep.SIMULATING);
      logger.log(LogLevel.INFO, 'Simulating transaction...', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'executeTransaction');

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        logger.log(LogLevel.INFO, 'Transaction simulation successful', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'executeTransaction');
      } catch (simulationError: any) {
        logger.logError('Transaction simulation failed', { error: simulationError.message || simulationError }, 'executeTransaction', 'usePrivyPlaceOrder.ts');

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
            } else if (errorName === 'InsufficientBalance' || errorName.includes('InsufficientBalance')) {
             
              errorMessage = 'Insufficient balance in BalanceManager for this order. Please deposit more funds before placing this order.';
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

          // Fallback: Check error data/signature for errors that viem didn't decode
          // This should rarely be needed now that we have comprehensive error definitions in the ABI
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
        log.error('Full simulation error details', {
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

      logger.log(LogLevel.INFO, 'Transaction submitted', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivyPlaceOrder.ts', 'executeTransaction');
      setHash(txHash);

      // 7. Wait for confirmation with logging
      setCurrentStep(OrderStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await waitForTransactionWithLogging(
        walletClient,
        txHash,
        60_000 // 1 minute timeout
      );

      setIsConfirming(false);
      setReceipt(txReceipt);

      // 8. Check transaction status
      if (txReceipt.status === 'reverted') {
        logger.log(LogLevel.ERROR, 'Transaction failed on-chain', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivyPlaceOrder.ts', 'executeTransaction');

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

      logger.log(LogLevel.INFO, 'Transaction confirmed', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash: txReceipt.transactionHash }, 'usePrivyPlaceOrder.ts', 'executeTransaction');
      setCurrentStep(OrderStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(OrderStep.ERROR);
      logger.logError('Transaction failed', { error: error instanceof Error ? error.message : String(error) }, 'executeTransaction', 'usePrivyPlaceOrder.ts');
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain, logger]);

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
        logger.logError('Wallet not connected', {}, 'placeMarketOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        const error = new Error('Invalid pool: base and quote addresses are required');
        logger.logError('Invalid pool configuration', {}, 'placeMarketOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        const error = new Error('Invalid quantity: must be greater than 0');
        logger.logError('Invalid quantity', {}, 'placeMarketOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      // Allow zero deposit amount for market orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        const error = new Error('Invalid deposit amount: cannot be negative');
        logger.logError('Invalid deposit amount', {}, 'placeMarketOrder', 'usePrivyPlaceOrder.ts');
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

      logger.log(LogLevel.INFO, `Placing market ${side === OrderSide.BUY ? 'buy' : 'sell'} order for ${quantity} tokens`, LogLabel.TRADING, ServiceName.TRADING_UI, { side, quantity }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');

      // Create intercepted wallet client for validation checks (reused for trading rules and balance checks)
      const provider = await embeddedWallet.getEthereumProvider();
      const walletClient = createInterceptedWalletClient(
        provider,
        address as `0x${string}`,
        ChainConfig.defaultChainId
      );

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

        logger.log(LogLevel.INFO, 'Trading rules fetched', LogLabel.TRADING, ServiceName.TRADING_UI, {
          minOrderSize: formatUnits(tradingRules.minOrderSize, quantityDecimals),
          minTradeAmount: formatUnits(tradingRules.minTradeAmount, quantityDecimals),
        }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');

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
          logger.log(LogLevel.WARN, `Order quantity should be a multiple of ${formatUnits(tradingRules.minAmountMovement, quantityDecimals)}`, LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
        }

        logger.log(LogLevel.INFO, 'Order validation passed', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
      } catch (error: any) {
        if (error.message.includes('minimum')) {
          throw error; // Re-throw validation errors
        }
        logger.log(LogLevel.WARN, 'Could not validate trading rules, proceeding anyway', LogLabel.TRADING, ServiceName.TRADING_UI, { error: error.message || error }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
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
          logger.log(LogLevel.INFO, `Orderbook has liquidity. Best ${side === OrderSide.BUY ? 'ask' : 'bid'}: ${formatUnits(bestPrice, depositDecimals)} ${side === OrderSide.BUY ? 'quote' : 'quote'} currency, Volume: ${formatUnits(volume, quantityDecimals)} base currency`, LogLabel.TRADING, ServiceName.TRADING_UI, { bestPrice, volume, side }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
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
        logger.log(LogLevel.WARN, 'Could not check orderbook liquidity', LogLabel.TRADING, ServiceName.TRADING_UI, { error: error.message || error }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
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

        logger.log(LogLevel.INFO, `BalanceManager balance: ${formatUnits(balance, requiredCurrencyDecimals)} ${requiredCurrencySymbol}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { balance, requiredCurrencySymbol }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');

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
        logger.log(LogLevel.WARN, 'Could not check BalanceManager balance', LogLabel.BALANCE, ServiceName.TRADING_UI, { error: error.message || error }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');
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
      logger.log(LogLevel.INFO, `Using orderBook: ${orderBookAddress}`, LogLabel.TRADING, ServiceName.TRADING_UI, { orderBookAddress }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');

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

      logger.log(LogLevel.INFO, 'Market order placed successfully', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivyPlaceOrder.ts', 'placeMarketOrder');

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Market order failed', { error: parsedError.message || parsedError }, 'placeMarketOrder', 'usePrivyPlaceOrder.ts');

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
        logger.logError('Wallet not connected', {}, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      // Validate inputs
      if (!pool.base || !pool.quote) {
        const error = new Error('Invalid pool: base and quote addresses are required');
        logger.logError('Invalid pool configuration', {}, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      if (!price || parseFloat(price) <= 0) {
        const error = new Error('Invalid price: must be greater than 0');
        logger.logError('Invalid price', {}, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        const error = new Error('Invalid quantity: must be greater than 0');
        logger.logError('Invalid quantity', {}, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');
        throw error;
      }

      // Allow zero deposit amount for limit orders
      if (depositAmount && parseFloat(depositAmount) < 0) {
        const error = new Error('Invalid deposit amount: cannot be negative');
        logger.logError('Invalid deposit amount', {}, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');
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

      // For limit orders, minOrderSize is the minimum order VALUE (quantity × price), not just quantity
      // Calculate order value in quote currency
      const orderValue = (quantityInWei * priceInWei) / (10n ** BigInt(quantityDecimals));

      logger.log(LogLevel.INFO, `Placing limit ${side === OrderSide.BUY ? 'buy' : 'sell'} order for ${quantity} tokens at price ${price}`, LogLabel.TRADING, ServiceName.TRADING_UI, { side, quantity, price }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');

      // Create intercepted wallet client for validation checks (reused for trading rules and balance checks)
      const provider = await embeddedWallet.getEthereumProvider();
      const walletClient = createInterceptedWalletClient(
        provider,
        address as `0x${string}`,
        ChainConfig.defaultChainId
      );

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

        logger.log(LogLevel.INFO, 'Trading rules fetched', LogLabel.TRADING, ServiceName.TRADING_UI, {
          minOrderSize: formatUnits(tradingRules.minOrderSize, quantityDecimals),
          minTradeAmount: formatUnits(tradingRules.minTradeAmount, quantityDecimals),
          minPriceMovement: formatUnits(tradingRules.minPriceMovement, priceDecimals),
        }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');

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
          logger.log(LogLevel.WARN, `Order quantity should be a multiple of ${formatUnits(tradingRules.minAmountMovement, quantityDecimals)}`, LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');
        }

        // Check if price is a multiple of minPriceMovement
        if (tradingRules.minPriceMovement > 0n && priceInWei % tradingRules.minPriceMovement !== 0n) {
          logger.log(LogLevel.WARN, `Order price should be a multiple of ${formatUnits(tradingRules.minPriceMovement, priceDecimals)}`, LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');
        }

        logger.log(LogLevel.INFO, 'Order validation passed', LogLabel.TRADING, ServiceName.TRADING_UI, {}, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');
      } catch (error: any) {
        if (error.message.includes('minimum')) {
          throw error; // Re-throw validation errors
        }
        logger.log(LogLevel.WARN, 'Could not validate trading rules, proceeding anyway', LogLabel.TRADING, ServiceName.TRADING_UI, { error: error.message || error }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');
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

        logger.log(LogLevel.INFO, `BalanceManager ${currencySymbol} currency balance: ${formatUnits(balance, currencyDecimals)}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { balance, currencySymbol }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');

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
        logger.log(LogLevel.WARN, 'Could not check BalanceManager balance', LogLabel.BALANCE, ServiceName.TRADING_UI, { error: error.message || error }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');
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
      logger.log(LogLevel.INFO, `Using orderBook: ${orderBookAddress}`, LogLabel.TRADING, ServiceName.TRADING_UI, { orderBookAddress }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');

      // Execute transaction (includes simulation, submission, and confirmation)
      // Pool parameter is [baseCurrency, quoteCurrency, orderBook] - NOT {base, quote, spacing, fee}!
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeLimitOrderWithFlags',
        args: [
          [checksumBaseAddress, checksumQuoteAddress, orderBookAddress], // Pool as array of 3 addresses
          BigInt(priceInWei.toString()),
          BigInt(quantityInWei.toString()),
          side,
          timeInForce,
          BigInt(depositAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
      });

      logger.log(LogLevel.INFO, 'Limit order placed successfully', LogLabel.TRADING, ServiceName.TRADING_UI, { txHash }, 'usePrivyPlaceOrder.ts', 'placeLimitOrder');

      setIsPending(false);
      onSuccess?.(txHash);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Limit order failed', { error: parsedError.message || parsedError }, 'placeLimitOrder', 'usePrivyPlaceOrder.ts');

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