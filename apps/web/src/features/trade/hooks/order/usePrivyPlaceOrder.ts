'use client';

import { ChainConfig } from '@/configs/chain';
import { BalanceManagerABI, Contracts, OrderBookABI, ScaleXRouterABI } from '@/configs/contracts';
import { logger } from '@/utils/prodLogger';
import { parseContractError } from '@/utils/tradingUtils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { createInterceptedWalletClient, getViemChain, waitForTransactionWithLogging } from '@/lib/viemClient';
import { waitForIndexerSync } from '@/utils/indexerUtils';
import { resolveOrderBook } from '@/features/trade/hooks/pool/usePoolResolver';
import { getBalanceManagerBalance } from '@/features/trade/hooks/balance/useBalanceManagerBalance';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum OrderSide {
  BUY = 0,
  SELL = 1,
}

export enum TimeInForce {
  GTC = 0,
  IOC = 1,
  FOK = 2,
  PO = 3,
}

export enum OrderStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SIMULATING = 'simulating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  SYNCING = 'syncing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Pool {
  base: string;
  quote: string;
  spacing: number;
  fee: number;
}

interface PlaceOrderCallbacks {
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

const log = logger.withContext({ hook: 'usePrivyPlaceOrder' });

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** Validate wallet authentication state. Throws if not ready. */
function assertWalletReady(
  ready: boolean,
  authenticated: boolean,
  embeddedWallet: any,
  address: string | undefined,
): void {
  if (!ready || !authenticated || !embeddedWallet || !address) {
    throw new Error('Please connect your wallet first');
  }
}

/** Validate common order inputs. Throws on invalid params. */
function validateCommonInputs(pool: Pool, quantity: string, depositAmount: string): void {
  if (!pool.base || !pool.quote) {
    throw new Error('Invalid pool: base and quote addresses are required');
  }
  if (!quantity || parseFloat(quantity) <= 0) {
    throw new Error('Invalid quantity: must be greater than 0');
  }
  if (depositAmount && parseFloat(depositAmount) < 0) {
    throw new Error('Invalid deposit amount: cannot be negative');
  }
}

/** Fetch trading rules from the orderbook contract. Returns null if unavailable. */
async function fetchTradingRules(
  walletClient: any,
  orderBookAddress: `0x${string}`,
): Promise<TradingRules | null> {
  try {
    return await walletClient.readContract({
      address: orderBookAddress,
      abi: OrderBookABI,
      functionName: 'getTradingRules',
    }) as TradingRules;
  } catch {
    log.warn('Could not fetch trading rules, proceeding anyway');
    return null;
  }
}

/** Validate market order against trading rules. */
function validateMarketTradingRules(
  quantityInWei: bigint,
  rules: TradingRules,
  quantityDecimals: number,
): void {
  if (quantityInWei < rules.minOrderSize) {
    throw new Error(
      `Order quantity (${formatUnits(quantityInWei, quantityDecimals)}) is below minimum ` +
      `(${formatUnits(rules.minOrderSize, quantityDecimals)}). Please increase your order size.`
    );
  }
  if (quantityInWei < rules.minTradeAmount) {
    throw new Error(
      `Order quantity (${formatUnits(quantityInWei, quantityDecimals)}) is below minimum trade amount ` +
      `(${formatUnits(rules.minTradeAmount, quantityDecimals)}). Please increase your order size.`
    );
  }
}

/** Validate limit order against trading rules. */
function validateLimitTradingRules(
  quantityInWei: bigint,
  priceInWei: bigint,
  orderValue: bigint,
  rules: TradingRules,
  quantityDecimals: number,
  priceDecimals: number,
): void {
  if (orderValue < rules.minOrderSize) {
    const minValue = formatUnits(rules.minOrderSize, priceDecimals);
    const currentValue = formatUnits(orderValue, priceDecimals);
    throw new Error(
      `Order value (${currentValue} quote currency) is below minimum (${minValue} quote currency). ` +
      `For limit orders, quantity × price must be at least ${minValue}. ` +
      `Increase either the quantity or the price.`
    );
  }
  if (quantityInWei < rules.minTradeAmount) {
    throw new Error(
      `Order quantity (${formatUnits(quantityInWei, quantityDecimals)} base currency) is below minimum ` +
      `(${formatUnits(rules.minTradeAmount, quantityDecimals)} base currency). Increase the quantity.`
    );
  }
  if (rules.minPriceMovement > 0n && priceInWei % rules.minPriceMovement !== 0n) {
    log.warn('Price not aligned to min price movement', {
      minPriceMovement: formatUnits(rules.minPriceMovement, priceDecimals),
    });
  }
}

/** Check liquidity via router's getBestPrice. Throws if no liquidity. */
async function checkOrderbookLiquidity(
  walletClient: any,
  routerAddress: `0x${string}`,
  baseAddress: `0x${string}`,
  quoteAddress: `0x${string}`,
  side: OrderSide,
): Promise<void> {
  // For BUY orders check asks (SELL=1), for SELL orders check bids (BUY=0)
  const querySide = side === OrderSide.BUY ? 1 : 0;

  try {
    const priceVolume = await walletClient.readContract({
      address: routerAddress,
      abi: [{
        inputs: [
          { internalType: 'address', name: 'baseCurrency', type: 'address' },
          { internalType: 'address', name: 'quoteCurrency', type: 'address' },
          { internalType: 'uint8', name: 'side', type: 'uint8' },
        ],
        name: 'getBestPrice',
        outputs: [{
          components: [
            { internalType: 'uint128', name: 'price', type: 'uint128' },
            { internalType: 'uint128', name: 'volume', type: 'uint128' },
          ],
          internalType: 'struct IOrderBook.PriceVolume',
          name: '',
          type: 'tuple',
        }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'getBestPrice',
      args: [baseAddress, quoteAddress, querySide],
    }) as any;

    if (priceVolume.price === 0n || priceVolume.volume === 0n) {
      throw new Error('No liquidity');
    }
  } catch (err: any) {
    const orderType = side === OrderSide.BUY ? 'sell' : 'buy';
    throw new Error(
      `No liquidity available in orderbook. There are no ${orderType} orders to match against. ` +
      `Please place a limit order first, or wait for other traders to add liquidity.`
    );
  }
}

/** Check user balance in BalanceManager. Throws if insufficient (when autoBorrow is off). */
async function checkUserBalance(
  walletClient: any,
  userAddress: `0x${string}`,
  currencyAddress: `0x${string}`,
  requiredAmount: bigint | null,
  currencyLabel: string,
  currencyDecimals: number,
  autoBorrow: boolean,
): Promise<void> {
  try {
    const balance = await getBalanceManagerBalance(walletClient, userAddress, currencyAddress);

    log.info('BalanceManager balance', {
      balance: formatUnits(balance, currencyDecimals),
      currency: currencyLabel,
      autoBorrow,
    });

    if (autoBorrow) return; // Contract handles borrowing

    if (balance === 0n) {
      throw new Error(`No ${currencyLabel} balance in BalanceManager. Please deposit first, or enable Auto Borrow.`);
    }

    if (requiredAmount !== null && balance < requiredAmount) {
      throw new Error(
        `Insufficient ${currencyLabel} balance. ` +
        `Required: ${formatUnits(requiredAmount, currencyDecimals)}, ` +
        `Available: ${formatUnits(balance, currencyDecimals)}. ` +
        `Please deposit more or enable Auto Borrow.`
      );
    }
  } catch (err: any) {
    if (err.message.includes('balance') || err.message.includes('Insufficient')) {
      throw err;
    }
    log.warn('Could not check BalanceManager balance');
  }
}

/** Parse simulation errors into user-friendly messages. */
function parseSimulationError(simulationError: any): string {
  // Walk through viem's error chain to find the root cause
  let currentError = simulationError;

  while (currentError) {
    let errorName: string | undefined;
    try { errorName = currentError.name || currentError.cause?.name; } catch { /* ignore */ }

    if (errorName && errorName !== 'ContractFunctionRevertedError') {
      if (errorName.includes('OrderHasNoLiquidity')) {
        return 'No liquidity available. The orderbook is empty or has no matching orders. Try placing a limit order instead.';
      }
      if (errorName.includes('InsufficientBalance') || errorName.includes('InsufficientSwapBalance')) {
        return 'Insufficient balance in BalanceManager. Please deposit more funds.';
      }
      if (errorName.includes('OrderTooSmall')) {
        return 'Order value is below minimum (5 USDC). For limit orders, quantity × price must be at least 5 USDC. Increase either the quantity or the price.';
      }
      if (errorName !== 'Error') {
        return `Contract error: ${errorName}`;
      }
    }

    // Check raw error data
    try {
      const errorData = currentError.data || currentError.cause?.data;
      if (typeof errorData === 'string' && errorData.startsWith('0x')) {
        return `Contract reverted with data: ${errorData}`;
      }
    } catch { /* ignore */ }

    try { currentError = currentError.cause; } catch { currentError = null; }
  }

  // Fallback: check the message string for known patterns
  const fullMessage = simulationError.message || simulationError.shortMessage || String(simulationError);
  if (fullMessage.includes('OrderHasNoLiquidity')) {
    return 'No liquidity available. Try placing a limit order instead.';
  }
  if (fullMessage.includes('InsufficientSwapBalance')) {
    return 'Insufficient balance in BalanceManager. Please deposit more funds.';
  }
  if (fullMessage.includes('OrderTooSmall')) {
    return 'Order value is below minimum (5 USDC). Increase either the quantity or the price.';
  }

  return 'Transaction simulation failed. Possible causes: no liquidity, insufficient balance, or invalid order parameters.';
}

// ─── Main Hook ───────────────────────────────────────────────────────────────

export function usePrivyPlaceOrder({ onSuccess, onError }: PlaceOrderCallbacks = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<OrderStep>(OrderStep.IDLE);
  const [receipt, setReceipt] = useState<any | null>(null);

  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const address = embeddedWallet?.address || user?.wallet?.address;

  // ── Wallet Client Factory ──────────────────────────────────────────────

  const createWalletClient = useCallback(async () => {
    if (!embeddedWallet || !address) {
      throw new Error('No embedded wallet available');
    }
    const provider = await embeddedWallet.getEthereumProvider();
    return createInterceptedWalletClient(
      provider,
      address as `0x${string}`,
      ChainConfig.defaultChainId,
    );
  }, [embeddedWallet, address]);

  // ── Router Address ─────────────────────────────────────────────────────

  const getRouterAddress = useCallback((): `0x${string}` => {
    const chainContracts = Contracts[ChainConfig.defaultChainId];
    if (!chainContracts) {
      throw new Error(`ScaleXRouter contract not found on chain ${ChainConfig.defaultChainId}`);
    }
    return chainContracts.scaleXRouterAddress;
  }, []);

  // ── Chain Switching ────────────────────────────────────────────────────

  const switchChain = useCallback(async (targetChainId: number) => {
    if (!embeddedWallet) {
      throw new Error('No embedded wallet available for chain switching');
    }
    try {
      await embeddedWallet.switchChain(targetChainId);
    } catch {
      try {
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
        await embeddedWallet.switchChain(targetChainId);
      } catch (addError) {
        throw new Error(`Failed to switch to chain ${targetChainId}: ${(addError as any).message}`);
      }
    }
  }, [embeddedWallet]);

  // ── Transaction Executor ───────────────────────────────────────────────

  const executeTransaction = useCallback(async (contractCall: any) => {
    assertWalletReady(ready, authenticated, embeddedWallet, address);

    try {
      await switchChain(ChainConfig.defaultChainId);

      const walletClient = await createWalletClient();

      // Simulate
      setCurrentStep(OrderStep.SIMULATING);
      let request;
      try {
        const simResult = await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        request = simResult.request;
      } catch (simulationError: any) {
        log.error('Simulation failed', { error: String(simulationError) });
        throw new Error(`Transaction will fail: ${parseSimulationError(simulationError)}`);
      }

      // Submit
      setCurrentStep(OrderStep.SUBMITTING);
      const txHash = await walletClient.writeContract(request);
      setHash(txHash);
      log.info('Transaction submitted', { txHash });

      // Confirm
      setCurrentStep(OrderStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await waitForTransactionWithLogging(walletClient, txHash, 60_000);
      setIsConfirming(false);
      setReceipt(txReceipt);

      if (txReceipt.status === 'reverted') {
        // Try to get revert reason
        try {
          const tx = await walletClient.getTransaction({ hash: txHash });
          if (tx) {
            await walletClient.call({ to: tx.to, data: tx.input, value: tx.value });
          }
        } catch (callError: unknown) {
          const errorObj = callError as { data?: { data?: string }; message?: string };
          const reason = errorObj?.data?.data || errorObj?.message || 'Unknown revert reason';
          throw new Error(`Transaction failed: ${reason}`);
        }
        throw new Error('Transaction reverted');
      }

      log.info('Transaction confirmed', { txHash: txReceipt.transactionHash });

      // Wait for indexer sync
      setCurrentStep(OrderStep.SYNCING);
      try {
        await waitForIndexerSync(txReceipt.blockNumber);
      } catch {
        log.warn('Indexer sync timeout — proceeding anyway');
      }

      setCurrentStep(OrderStep.COMPLETED);
      setError(null);
      return txHash;
    } catch (err) {
      setIsConfirming(false);
      setCurrentStep(OrderStep.ERROR);
      throw err;
    }
  }, [ready, authenticated, embeddedWallet, address, switchChain, createWalletClient]);

  // ── Place Market Order ─────────────────────────────────────────────────

  const placeMarketOrder = async ({
    pool,
    quantity,
    side,
    depositAmount,
    minOutAmount = '0',
    quantityDecimals = 18,
    depositDecimals = 18,
    autoRepay = false,
    autoBorrow = false,
  }: MarketOrderParams) => {
    try {
      setIsPending(true);
      setError(null);
      setCurrentStep(OrderStep.VALIDATING);

      assertWalletReady(ready, authenticated, embeddedWallet, address);
      validateCommonInputs(pool, quantity, depositAmount);

      const routerAddress = getRouterAddress();
      const checksumBase = getAddress(pool.base);
      const checksumQuote = getAddress(pool.quote);
      const quantityInWei = parseUnits(quantity, quantityDecimals);
      const depositInWei = depositAmount ? parseUnits(depositAmount, depositDecimals) : 0n;
      const minOutInWei = parseUnits(minOutAmount, quantityDecimals);

      log.info(`Placing market ${side === OrderSide.BUY ? 'BUY' : 'SELL'}`, { quantity });

      const walletClient = await createWalletClient();

      // Resolve orderbook
      const orderBookAddress = await resolveOrderBook(walletClient, checksumBase, checksumQuote);

      // Validate trading rules
      const rules = await fetchTradingRules(walletClient, orderBookAddress);
      if (rules) {
        validateMarketTradingRules(quantityInWei, rules, quantityDecimals);
      }

      // Check liquidity
      try {
        await checkOrderbookLiquidity(walletClient, routerAddress, checksumBase, checksumQuote, side);
      } catch (err: any) {
        if (err.message.includes('liquidity') || err.message.includes('orders')) throw err;
        log.warn('Could not check orderbook liquidity');
      }

      // Check balance
      const requiredCurrency = side === OrderSide.BUY ? checksumQuote : checksumBase;
      const currencyLabel = side === OrderSide.BUY ? 'quote' : 'base';
      const currencyDecimals = side === OrderSide.BUY ? depositDecimals : quantityDecimals;
      const requiredAmount = side === OrderSide.SELL ? quantityInWei : null;

      await checkUserBalance(
        walletClient, address as `0x${string}`, requiredCurrency,
        requiredAmount, currencyLabel, currencyDecimals, autoBorrow,
      );

      // Execute
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeMarketOrder',
        args: [
          [checksumBase, checksumQuote, orderBookAddress],
          BigInt(quantityInWei.toString()),
          side,
          BigInt(depositInWei.toString()),
          BigInt(minOutInWei.toString()),
          autoRepay,
          autoBorrow,
        ],
      });

      log.info('Market order placed successfully', { txHash });
      setIsPending(false);
      onSuccess?.(txHash);
      return txHash;
    } catch (err) {
      const parsedError = parseContractError(err);
      log.error('Market order failed', { error: parsedError.message });
      setIsPending(false);
      setCurrentStep(OrderStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  // ── Place Limit Order ──────────────────────────────────────────────────

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
    autoBorrow = false,
  }: LimitOrderParams) => {
    try {
      setIsPending(true);
      setError(null);
      setCurrentStep(OrderStep.VALIDATING);

      assertWalletReady(ready, authenticated, embeddedWallet, address);
      validateCommonInputs(pool, quantity, depositAmount);

      if (!price || parseFloat(price) <= 0) {
        throw new Error('Invalid price: must be greater than 0');
      }

      const routerAddress = getRouterAddress();
      const checksumBase = getAddress(pool.base);
      const checksumQuote = getAddress(pool.quote);
      const priceInWei = parseUnits(price, priceDecimals);
      const quantityInWei = parseUnits(quantity, quantityDecimals);
      const depositInWei = depositAmount ? parseUnits(depositAmount, depositDecimals) : 0n;
      const orderValue = (quantityInWei * priceInWei) / (10n ** BigInt(quantityDecimals));

      log.info(`Placing limit ${side === OrderSide.BUY ? 'BUY' : 'SELL'}`, { quantity, price });

      const walletClient = await createWalletClient();

      // Resolve orderbook
      const orderBookAddress = await resolveOrderBook(walletClient, checksumBase, checksumQuote);

      // Validate trading rules
      const rules = await fetchTradingRules(walletClient, orderBookAddress);
      if (rules) {
        validateLimitTradingRules(quantityInWei, priceInWei, orderValue, rules, quantityDecimals, priceDecimals);
      }

      // Check balance
      const requiredCurrency = side === OrderSide.BUY ? checksumQuote : checksumBase;
      const requiredAmount = side === OrderSide.BUY ? orderValue : quantityInWei;
      const currencyLabel = side === OrderSide.BUY ? 'quote' : 'base';
      const currencyDecimals = side === OrderSide.BUY ? priceDecimals : quantityDecimals;

      await checkUserBalance(
        walletClient, address as `0x${string}`, requiredCurrency,
        requiredAmount, currencyLabel, currencyDecimals, autoBorrow,
      );

      // Execute
      const txHash = await executeTransaction({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeLimitOrderWithFlags',
        args: [
          [checksumBase, checksumQuote, orderBookAddress],
          BigInt(priceInWei.toString()),
          BigInt(quantityInWei.toString()),
          side,
          timeInForce,
          BigInt(depositInWei.toString()),
          autoRepay,
          autoBorrow,
        ],
      });

      log.info('Limit order placed successfully', { txHash });
      setIsPending(false);
      onSuccess?.(txHash);
      return txHash;
    } catch (err) {
      const parsedError = parseContractError(err);
      log.error('Limit order failed', { error: parsedError.message });
      setIsPending(false);
      setCurrentStep(OrderStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  // ── Return ─────────────────────────────────────────────────────────────

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

// ─── Utility Exports ─────────────────────────────────────────────────────────

export function getSideLabel(side: OrderSide): string {
  return side === OrderSide.BUY ? 'Buy' : 'Sell';
}

export function getTimeInForceLabel(timeInForce: TimeInForce): string {
  switch (timeInForce) {
    case TimeInForce.GTC: return "Good 'Til Canceled";
    case TimeInForce.IOC: return 'Immediate Or Cancel';
    case TimeInForce.FOK: return 'Fill Or Kill';
    case TimeInForce.PO: return 'Post Only';
    default: return 'Unknown';
  }
}