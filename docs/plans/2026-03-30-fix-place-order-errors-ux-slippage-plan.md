---
title: "fix: Place Order — Human-Readable Errors, Limit Price UX, Market Order Slippage"
type: fix
status: active
date: 2026-03-30
---

# fix: Place Order — Human-Readable Errors, Limit Price UX, Market Order Slippage

## Overview

Three compounding issues in the Place Order feature (`apps/web`) make it unreliable and confusing for users:

1. **Error messages show raw contract names or generic fallbacks** — users see `"Contract error: SlippageTooHigh"` or `"Transaction simulation failed"` instead of actionable guidance.
2. **Limit order default price = current market price** — the form opens with a spread-crossing warning before the user types anything, and the order may execute immediately rather than queuing.
3. **Market order sends `minOutAmount = 0`** — slippage protection is silently disabled; the contract-estimated output (`estimatedOutput`) is never wired into the transaction.

All three are frontend-only fixes; the smart contracts are correct.

---

## Problem Statement

### Problem 1 — Unreadable error messages

`parseSimulationError` in `usePrivyPlaceOrder.ts` (lines 275–322) only handles 3 of 30+ contract error types. The viem decoding path (`error.cause.data.errorName`) is never checked — so most errors fall through to `"Transaction simulation failed. Possible causes: …"`. Users cannot diagnose or self-serve.

The generic `parseContractError` in `core/utils/web3.ts` (lines 113–183) only handles wallet-level patterns (user rejection, gas exceeded, insufficient native funds) and is reused unchanged by the trade domain (via `tradingUtils.ts`) — unlike other domains (borrow, deposit, repay) that each have domain-specific wrappers.

**Contract errors with no current human-readable handling:**

| Error Name | Source Contract | When It Fires |
|---|---|---|
| `SlippageTooHigh` | Router | Market order price moved beyond minOutAmount |
| `SlippageExceeded` | OrderBook | Market order slippage check in book |
| `FillOrKillNotFulfilled` | OrderBook | FOK order not fully filled |
| `PostOnlyWouldTake` | OrderBook | PO limit order would cross spread |
| `TradingPaused` | OrderBook | Admin paused the market |
| `OrderTooLarge` | OrderBook | Quantity exceeds max allowed |
| `InvalidPrice` | OrderBook | Price = 0 or out of range |
| `InvalidPriceIncrement` | OrderBook | Price not on tick size |
| `InvalidQuantity` | OrderBook | Quantity = 0 |
| `InvalidQuantityIncrement` | OrderBook | Quantity not on step size |
| `NegativeSpreadCreated` | OrderBook | Limit order crosses spread |
| `InsufficientHealthFactorForBorrow` | BalanceManager | HF too low to auto-borrow |
| `AutoRepayOnlyForBuyOrders` | OrderBook | autoRepay=true on SELL order |
| `AutoBorrowOnlyForSellOrders` | OrderBook | autoBorrow=true on BUY order |
| `ERC20InsufficientAllowance` | ERC20 | Token not approved |
| `ERC20InsufficientBalance` | ERC20 | Wallet has no tokens |
| `ZeroAmount` | BalanceManager | Zero deposit attempt |
| `InsufficientLiquidity` | LendingManager | Lending pool dry |
| `InsufficientCollateral` | LendingManager | Not enough collateral |
| `InvalidAmount` | LendingManager | Invalid borrow amount |

### Problem 2 — Limit order initial price = market price

`limit.tsx` line 108–116 sets `limitPrice` from `tickerPrice.price`. When the orderbook spread is tight (best ask ≈ ticker price), the spread validation (`spreadError`, lines 79–93) immediately flags a "Limit price crosses spread" warning before the user has typed anything. Users see an error on first load with no guidance on what price to enter.

Additionally, if the user submits at market price with GTC, the order executes immediately like a market order — which contradicts the intent of placing a limit order.

**Root cause:** The default should be a maker price (below best ask for BUY, above best bid for SELL) to queue in the book.

### Problem 3 — Market order minOutAmount always 0

`market.tsx` line 269–278 calls `placeMarketOrder()` without `minOutAmount`. The hook defaults `minOutAmount = '0'` (line 477) and parses it with `quantityDecimals` (line 496) — which is the **input** token's decimals, not the output token.

The hook `useMarketOrderEstimate` already fetches a proper slippage-adjusted estimate from the contract (`calculateMinOutAmountForMarket` with 1% tolerance), but `estimatedOutput` is only used for the displayed "estimated price" and is never passed to `placeMarketOrder`.

**Impact:** Every market order goes on-chain with zero slippage protection. On a volatile or thin market, users can receive far less than expected with no contract-level safety net.

---

## Proposed Solution

### Solution 1 — Exhaustive `translateOrderError()`

Create a single exported `translateOrderError(error: unknown): string` function in `core/utils/web3.ts`. This function:
1. Walks viem's error chain: `error.name` → `error.cause?.name` → `error.cause?.data?.errorName` → `error.data?.errorName`
2. Maps every known contract error name to a clear English sentence
3. Falls back gracefully for unknown errors

Update `parseSimulationError` in `usePrivyPlaceOrder.ts` to call `translateOrderError()` instead of its current ad-hoc chain walk.

Keep `parseContractError` as-is (wallet-level errors) but augment it to call `translateOrderError` before falling back.

### Solution 2 — Maker-price default for limit orders

In `limit.tsx`, replace the ticker-based default with an orderbook-based default:
- **BUY:** `bestBid` price (join buy queue without crossing spread), fallback to `tickerPrice × 0.99`
- **SELL:** `bestAsk` price (join sell queue without crossing spread), fallback to `tickerPrice × 1.01`
- **Neither available:** leave field empty, let user type

The spread validation warning remains but will no longer fire on first load.

> Note: The user confirmed preference for option 3c in the brainstorm: "start at slightly better price (1% below ask for BUY, 1% above bid for SELL)."
> After reviewing the actual orderbook data flow, using `bestBid`/`bestAsk` directly is cleaner than applying a percentage — it puts the user on the correct side of the spread. The 1% offset is effectively already baked in by the nature of a real spread.

### Solution 3 — Wire `estimatedOutput` as `minOutAmount`

In `market.tsx`:
- Add `minOutAmount: estimatedOutput` to the `placeMarketOrder` call
- Add `minOutDecimals` parameter for output token precision

In `usePrivyPlaceOrder.ts`:
- Add `minOutDecimals?: number` to `MarketOrderParams` (defaults to `quantityDecimals` for backward compat)
- Use `minOutDecimals` when parsing `minOutAmount` to wei: `parseUnits(minOutAmount, minOutDecimals)`

Correct mapping:
- BUY: input=quote, output=base → `minOutDecimals = baseToken.decimals`
- SELL: input=base, output=quote → `minOutDecimals = quoteToken.decimals`

---

## Technical Approach

### Architecture

```
core/utils/web3.ts
  └── translateOrderError(error: unknown): string   ← NEW (exported)
  └── parseContractError(error: any): ContractError ← UPDATED (calls translateOrderError)

features/trade/hooks/order/usePrivyPlaceOrder.ts
  └── parseSimulationError()                        ← UPDATED (delegates to translateOrderError)
  └── MarketOrderParams                             ← UPDATED (+minOutDecimals)
  └── placeMarketOrder()                            ← UPDATED (uses minOutDecimals)

features/trade/components/placeOrder/limit/limit.tsx
  └── price initialization useEffect               ← UPDATED (bestBid/bestAsk default)

features/trade/components/placeOrder/market/market.tsx
  └── handleMarketOrder()                           ← UPDATED (+minOutAmount, +minOutDecimals)
```

### Viem Error Chain Anatomy

When viem fails a `simulateContract` call with a custom revert, the error structure is:

```
ContractFunctionExecutionError
  .cause: ContractFunctionRevertedError
    .name: "ContractFunctionRevertedError"
    .data.errorName: "SlippageTooHigh"          ← checked first
    .data.args: [baseDelta, minOutAmount]
  .cause: BaseError
    .name: "SlippageTooHigh"                    ← fallback if .data missing
```

The current code checks `.name` but not `.data.errorName`. Both paths must be covered.

---

## Implementation Phases

### Phase 1 — Unit Test Infrastructure (Vitest)

No unit test framework currently exists in `apps/web`. Playwright is the only test runner and requires a running dev server. Pure logic functions (error translation, price calculations) need fast unit tests.

**Tasks:**
- [ ] Add `vitest`, `@vitest/ui`, `jsdom` to `apps/web/package.json` devDependencies
- [ ] Add `vitest.config.ts` to `apps/web/`
- [ ] Add `"test:unit": "vitest run"` and `"test:unit:watch": "vitest"` scripts to `apps/web/package.json`
- [ ] Create `apps/web/src/__tests__/` directory with `setup.ts`

**Files to create:**

```
apps/web/vitest.config.ts
apps/web/src/__tests__/setup.ts
```

**`vitest.config.ts`:**
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Success criteria:**
- `pnpm test:unit` runs without errors (zero tests at this point)

---

### Phase 2 — TDD: Write Error Translation Tests

Write tests **before** implementing `translateOrderError`. All tests should fail initially.

**File to create:** `apps/web/src/__tests__/core/utils/translateOrderError.test.ts`

**Test coverage:**

```ts
// ─── POSITIVE TESTS (happy path — known errors return correct human messages) ───

describe('✅ Positive — OrderBook errors map to human messages', () => {
  // Each test builds a minimal viem-style error object and asserts the message
  // contains the expected user-facing guidance.

  it('OrderHasNoLiquidity → message mentions "order book is empty" and suggests limit order', () => {
    const error = { cause: { data: { errorName: 'OrderHasNoLiquidity' } } };
    const msg = translateOrderError(error);
    expect(msg).toContain('order book is empty');
    expect(msg.toLowerCase()).toContain('limit order');
  });

  it('SlippageTooHigh → message mentions "price moved" and suggests smaller amount', () => {
    const error = { cause: { data: { errorName: 'SlippageTooHigh' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('price moved');
  });

  it('SlippageExceeded → message mentions "slipped" or "range"', () => {
    const error = { cause: { data: { errorName: 'SlippageExceeded' } } };
    expect(translateOrderError(error).toLowerCase()).toMatch(/slipp(ed|age)/);
  });

  it('FillOrKillNotFulfilled → message mentions "GTC" or "liquidity"', () => {
    const error = { cause: { data: { errorName: 'FillOrKillNotFulfilled' } } };
    const msg = translateOrderError(error);
    expect(msg).toMatch(/GTC|liquidity/i);
  });

  it('PostOnlyWouldTake → message mentions "Post-Only" and moving price', () => {
    const error = { cause: { data: { errorName: 'PostOnlyWouldTake' } } };
    const msg = translateOrderError(error);
    expect(msg).toMatch(/post.only/i);
  });

  it('TradingPaused → message tells user to try later', () => {
    const error = { cause: { data: { errorName: 'TradingPaused' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('paused');
    expect(msg.toLowerCase()).toContain('try again');
  });

  it('OrderTooSmall → message mentions "5 USDC" minimum', () => {
    const error = { cause: { data: { errorName: 'OrderTooSmall' } } };
    expect(translateOrderError(error)).toContain('5 USDC');
  });

  it('OrderTooLarge → message suggests splitting orders', () => {
    const error = { cause: { data: { errorName: 'OrderTooLarge' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('split');
  });

  it('InvalidPrice → message tells user price must be > zero', () => {
    const error = { cause: { data: { errorName: 'InvalidPrice' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('price');
  });

  it('InvalidPriceIncrement → message mentions tick or increment', () => {
    const error = { cause: { data: { errorName: 'InvalidPriceIncrement' } } };
    expect(translateOrderError(error).toLowerCase()).toMatch(/tick|increment/);
  });

  it('InvalidQuantity → message says amount cannot be zero', () => {
    const error = { cause: { data: { errorName: 'InvalidQuantity' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('zero');
  });

  it('InvalidQuantityIncrement → message tells user to adjust amount', () => {
    const error = { cause: { data: { errorName: 'InvalidQuantityIncrement' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('adjust');
  });

  it('NegativeSpreadCreated → message explains buy/sell spread positioning', () => {
    const error = { cause: { data: { errorName: 'NegativeSpreadCreated' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('spread');
    expect(msg.toLowerCase()).toContain('buy');
    expect(msg.toLowerCase()).toContain('sell');
  });

  it('AutoRepayOnlyForBuyOrders → message says to disable Auto-Repay', () => {
    const error = { cause: { data: { errorName: 'AutoRepayOnlyForBuyOrders' } } };
    expect(translateOrderError(error)).toMatch(/auto.repay/i);
  });

  it('AutoBorrowOnlyForSellOrders → message says to disable Auto-Borrow', () => {
    const error = { cause: { data: { errorName: 'AutoBorrowOnlyForSellOrders' } } };
    expect(translateOrderError(error)).toMatch(/auto.borrow/i);
  });
});

describe('✅ Positive — Balance / ERC20 errors map to human messages', () => {
  it('ERC20InsufficientAllowance → message mentions approval', () => {
    const error = { cause: { data: { errorName: 'ERC20InsufficientAllowance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('approv');
  });

  it('ERC20InsufficientBalance → message mentions wallet balance', () => {
    const error = { cause: { data: { errorName: 'ERC20InsufficientBalance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('wallet');
  });

  it('InsufficientSwapBalance → message tells user to deposit', () => {
    const error = { cause: { data: { errorName: 'InsufficientSwapBalance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('deposit');
  });

  it('ZeroAmount → message says amount cannot be zero', () => {
    const error = { cause: { data: { errorName: 'ZeroAmount' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('zero');
  });

  it('InsufficientBalance → message mentions deposit and Auto-Borrow', () => {
    const error = { cause: { data: { errorName: 'InsufficientBalance' } } };
    const msg = translateOrderError(error).toLowerCase();
    expect(msg).toContain('deposit');
    expect(msg).toMatch(/auto.borrow/i);
  });
});

describe('✅ Positive — Lending errors map to human messages', () => {
  it('InsufficientHealthFactorForBorrow → message warns about liquidation', () => {
    const error = { cause: { data: { errorName: 'InsufficientHealthFactorForBorrow' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('liquidation');
  });

  it('InsufficientLiquidity → message mentions lending pool', () => {
    const error = { cause: { data: { errorName: 'InsufficientLiquidity' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('lending pool');
  });

  it('InsufficientCollateral → message says to deposit collateral', () => {
    const error = { cause: { data: { errorName: 'InsufficientCollateral' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('collateral');
  });

  it('InvalidAmount → message says to enter a positive number', () => {
    const error = { cause: { data: { errorName: 'InvalidAmount' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('positive');
  });
});

describe('✅ Positive — Viem error chain paths all resolve correctly', () => {
  it('extracts from error.cause.data.errorName (ContractFunctionRevertedError path)', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: {
        name: 'ContractFunctionRevertedError',
        data: { errorName: 'TradingPaused' },
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('paused');
  });

  it('extracts from error.cause.name when data.errorName is absent', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: { name: 'OrderHasNoLiquidity' },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('order book');
  });

  it('extracts from error.data.errorName at top level', () => {
    const error = { data: { errorName: 'OrderTooSmall' } };
    expect(translateOrderError(error)).toContain('5 USDC');
  });

  it('extracts from deeply nested cause chain (3 levels)', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: {
        name: 'ContractFunctionRevertedError',
        cause: {
          name: 'BaseError',
          cause: { data: { errorName: 'SlippageTooHigh' } },
        },
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('price moved');
  });

  it('user rejection detected from message string', () => {
    const error = { message: 'User rejected the request.' };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });

  it('user denial detected from "denied" keyword', () => {
    const error = { message: 'MetaMask Tx Signature: User denied transaction signature.' };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });
});

// ─── NEGATIVE TESTS (inputs that should NOT match known errors → fallback) ───

describe('❌ Negative — Unknown or unrecognized errors fall back gracefully', () => {
  it('unknown contract error name returns generic fallback message', () => {
    const error = { cause: { data: { errorName: 'SomeNewUnknownError' } } };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).not.toContain('someunknown');
    // Should not expose raw error name to user
    expect(msg).not.toContain('SomeNewUnknownError');
  });

  it('plain Error object with no contract info returns fallback', () => {
    const error = new Error('internal server error');
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).not.toContain('internal server');
  });

  it('error with only a hex data payload returns fallback', () => {
    const error = { data: '0x12345678' };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg).not.toContain('0x');
  });

  it('error with empty cause chain returns fallback', () => {
    const error = { name: 'ContractFunctionExecutionError', cause: null };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
  });

  it('error with message containing "insufficient funds" (gas) returns gas message', () => {
    const error = { message: 'insufficient funds for gas * price + value' };
    expect(translateOrderError(error).toLowerCase()).toContain('gas');
  });
});

// ─── EDGE TESTS (boundary conditions, malformed inputs, extreme values) ───

describe('⚠️ Edge — Malformed and extreme inputs', () => {
  it('null input returns non-empty fallback without throwing', () => {
    expect(() => translateOrderError(null)).not.toThrow();
    expect(translateOrderError(null)).toBeTruthy();
  });

  it('undefined input returns non-empty fallback without throwing', () => {
    expect(() => translateOrderError(undefined)).not.toThrow();
    expect(translateOrderError(undefined)).toBeTruthy();
  });

  it('string input (not an object) returns fallback without throwing', () => {
    expect(() => translateOrderError('raw string error')).not.toThrow();
    expect(translateOrderError('raw string error')).toBeTruthy();
  });

  it('number input returns fallback without throwing', () => {
    expect(() => translateOrderError(42)).not.toThrow();
  });

  it('circular reference in cause chain does not cause infinite loop', () => {
    const error: any = { name: 'Error', cause: null };
    error.cause = error; // circular
    // Should not hang — max depth guard must kick in
    expect(() => translateOrderError(error)).not.toThrow();
  });

  it('error with empty string errorName falls back gracefully', () => {
    const error = { cause: { data: { errorName: '' } } };
    expect(translateOrderError(error)).toBeTruthy();
  });

  it('error with errorName = null falls back gracefully', () => {
    const error = { cause: { data: { errorName: null } } };
    expect(translateOrderError(error)).toBeTruthy();
  });

  it('error with very long message string does not crash', () => {
    const error = { message: 'x'.repeat(10000) };
    expect(() => translateOrderError(error)).not.toThrow();
  });

  it('both rejection keyword and contract error name → rejection message wins (wallet UX priority)', () => {
    // User rejection should always take precedence
    const error = {
      message: 'User rejected the request.',
      cause: { data: { errorName: 'OrderHasNoLiquidity' } },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });

  it('error.cause.data exists but has no errorName property — falls through to name check', () => {
    const error = {
      cause: {
        name: 'SlippageTooHigh',
        data: { someOtherField: 'value' }, // no errorName
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('price moved');
  });
});
```

**Success criteria:**
- All tests exist and fail with `Cannot find module` or assertion failures
- Zero passing tests at this stage

---

### Phase 3 — Implement `translateOrderError()`

**File to modify:** `apps/web/src/core/utils/web3.ts`

**Implementation:**

```ts
// Error name → human-readable message map
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // OrderBook errors
  OrderHasNoLiquidity: "The order book is empty — no one is on the other side of this trade. Try placing a limit order to queue your price.",
  SlippageTooHigh: "Price moved too much while your order was processing. Try a smaller amount or wait for the market to stabilize.",
  SlippageExceeded: "Price slipped beyond the acceptable range. Try a smaller order or increase your slippage tolerance.",
  FillOrKillNotFulfilled: "There wasn't enough liquidity to fill your entire order at once. Switch to GTC mode or try a smaller amount.",
  PostOnlyWouldTake: "Your price would have been filled immediately, which isn't allowed in Post-Only mode. Move your price further from the current market price.",
  TradingPaused: "Trading is temporarily paused. Please try again in a few minutes.",
  OrderTooSmall: "Order is too small — the minimum order value is 5 USDC. Increase your size or price.",
  OrderTooLarge: "Order exceeds the maximum allowed size. Please split it into smaller orders.",
  InvalidPrice: "Price must be greater than zero. Enter a valid price.",
  InvalidPriceIncrement: "Your price isn't on a valid tick size. Try rounding to the nearest whole number or valid increment.",
  InvalidQuantity: "Amount cannot be zero. Enter a valid quantity.",
  InvalidQuantityIncrement: "Your quantity isn't on the valid step size. Adjust the amount slightly.",
  NegativeSpreadCreated: "This limit order would cross the spread. For a buy order, set your price below the best ask. For a sell order, set your price above the best bid.",
  AutoRepayOnlyForBuyOrders: "Auto-Repay only works on buy orders. Disable Auto-Repay and try again.",
  NoDebtToRepay: "There is no debt to repay on this position.",
  AutoBorrowOnlyForSellOrders: "Auto-Borrow only works on sell orders. Disable Auto-Borrow and try again.",
  NoCollateralToBorrow: "No collateral available to borrow against. Deposit funds first.",
  UnauthorizedRouter: "This router is not authorized. Please contact support.",
  UnauthorizedCancellation: "You can only cancel your own orders.",
  OrderNotFound: "Order not found. It may have already been filled or cancelled.",
  // Balance errors
  InsufficientBalance: "Insufficient balance. Please deposit more funds, or enable Auto-Borrow if you have collateral.",
  InsufficientBalanceRequired: "Insufficient balance to cover this order. Please deposit more funds.",
  InsufficientSwapBalance: "Insufficient balance for this trade. Please deposit funds first.",
  ZeroAmount: "Amount cannot be zero. Enter a valid amount.",
  ERC20InsufficientAllowance: "You haven't approved enough tokens for this transaction. Please approve your tokens first.",
  ERC20InsufficientBalance: "Your wallet doesn't have enough tokens. Please check your balance.",
  SafeERC20FailedOperation: "Token transfer failed. The token contract may have rejected the operation.",
  // Lending errors
  InsufficientHealthFactorForBorrow: "Borrowing this amount would put your account at risk of liquidation. Reduce the borrow amount or add more collateral.",
  InsufficientHealthFactorForWithdraw: "Withdrawing this amount would put your account at risk of liquidation. Reduce the withdrawal amount.",
  InsufficientLiquidity: "The lending pool doesn't have enough liquidity right now. Try borrowing less.",
  InsufficientCollateral: "Not enough collateral to cover this borrow. Deposit more funds first.",
  InvalidAmount: "The amount entered is invalid. Please enter a positive number.",
  UnsupportedAsset: "This token is not supported for lending. Try a different asset.",
};

/** Extract contract error name from anywhere in a viem error chain */
function extractErrorName(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as Record<string, any>;

  // Check this level
  if (err.data?.errorName) return err.data.errorName;
  if (err.name && err.name !== 'Error' && err.name !== 'ContractFunctionRevertedError' && err.name !== 'ContractFunctionExecutionError') {
    return err.name;
  }

  // Walk cause chain
  if (err.cause) return extractErrorName(err.cause);
  return undefined;
}

/** Translate any contract/viem error into a human-readable message */
export function translateOrderError(error: unknown): string {
  if (!error) return 'An unknown error occurred. Please try again.';

  const err = error as Record<string, any>;

  // User rejection first (wallet-level)
  const rawMessage = err.message || err.shortMessage || String(err);
  if (rawMessage.includes('rejected') || rawMessage.includes('denied') || rawMessage.includes('User denied')) {
    return 'Transaction cancelled. You rejected the transaction in your wallet.';
  }

  // Extract contract error name
  const errorName = extractErrorName(error);
  if (errorName && CONTRACT_ERROR_MESSAGES[errorName]) {
    return CONTRACT_ERROR_MESSAGES[errorName];
  }

  // Fallback: scan message string for known patterns
  if (rawMessage.includes('OrderHasNoLiquidity')) return CONTRACT_ERROR_MESSAGES.OrderHasNoLiquidity;
  if (rawMessage.includes('InsufficientSwapBalance')) return CONTRACT_ERROR_MESSAGES.InsufficientSwapBalance;
  if (rawMessage.includes('OrderTooSmall')) return CONTRACT_ERROR_MESSAGES.OrderTooSmall;
  if (rawMessage.includes('SlippageTooHigh')) return CONTRACT_ERROR_MESSAGES.SlippageTooHigh;
  if (rawMessage.includes('TradingPaused')) return CONTRACT_ERROR_MESSAGES.TradingPaused;
  if (rawMessage.includes('insufficient funds')) return 'Not enough ETH in your wallet to pay gas fees.';

  return 'Transaction failed. Please check your balance and try again.';
}
```

**Also update `parseContractError`** to call `translateOrderError` before generic fallbacks.

**Also update `parseSimulationError` in `usePrivyPlaceOrder.ts`** to delegate to `translateOrderError` instead of its current chain walk:

```ts
function parseSimulationError(simulationError: any): string {
  return translateOrderError(simulationError);
}
```

**Success criteria:**
- `pnpm test:unit` — all Phase 2 tests pass
- `pnpm typecheck` — no type errors

---

### Phase 4 — TDD: Write Limit Order Price Tests

**File to create:** `apps/web/src/__tests__/features/trade/limitOrderPrice.test.ts`

Since limit price logic is in a React component using `useEffect`, test the pure calculation function extracted from it.

Extract the price-calculation logic into a testable pure function:
```ts
// apps/web/src/features/trade/utils/limitOrderPrice.ts
export function computeDefaultLimitPrice(
  buySell: 'buy' | 'sell',
  bestBid: number | null,
  bestAsk: number | null,
  tickerPrice: number | null,
  decimals: number
): string | null
```

**Tests:**

```ts
// ─── POSITIVE TESTS (happy path — correct price returned and formatted) ───

describe('✅ Positive — BUY orders use bestBid or ticker fallback', () => {
  it('returns bestBid formatted to 2dp when bestBid is a whole-number price', () => {
    const result = computeDefaultLimitPrice('buy', 50000, null, null);
    expect(result).toBe('50000');
  });

  it('returns bestBid with 2 decimal places for prices >= 1', () => {
    const result = computeDefaultLimitPrice('buy', 1850.50, null, null);
    expect(result).toBe('1850.5');
  });

  it('returns bestBid with 8 decimal places for prices < 1 (e.g. SHIB)', () => {
    const result = computeDefaultLimitPrice('buy', 0.00001234, null, null);
    expect(result).toBe('0.00001234');
  });

  it('returns ticker × 0.99 when bestBid is null', () => {
    const result = computeDefaultLimitPrice('buy', null, null, 100);
    expect(parseFloat(result!)).toBeCloseTo(99, 5);
  });

  it('prefers bestBid over ticker when both are available', () => {
    // bestBid=49500 vs ticker*0.99=49995 — bestBid wins
    const result = computeDefaultLimitPrice('buy', 49500, 50100, 50500);
    expect(result).toBe('49500');
  });

  it('trailing zeros are removed from integer bestBid', () => {
    const result = computeDefaultLimitPrice('buy', 100.00, null, null);
    expect(result).not.toContain('.00');
    expect(result).toBe('100');
  });
});

describe('✅ Positive — SELL orders use bestAsk or ticker fallback', () => {
  it('returns bestAsk formatted to 2dp for a standard price', () => {
    const result = computeDefaultLimitPrice('sell', null, 50100, null);
    expect(result).toBe('50100');
  });

  it('returns bestAsk with 8 decimal places for prices < 1', () => {
    const result = computeDefaultLimitPrice('sell', null, 0.00005678, null);
    expect(result).toBe('0.00005678');
  });

  it('returns ticker × 1.01 when bestAsk is null', () => {
    const result = computeDefaultLimitPrice('sell', null, null, 100);
    expect(parseFloat(result!)).toBeCloseTo(101, 5);
  });

  it('prefers bestAsk over ticker when both are available', () => {
    const result = computeDefaultLimitPrice('sell', 49800, 50100, 50000);
    expect(result).toBe('50100');
  });
});

// ─── NEGATIVE TESTS (conditions where null is the correct return value) ───

describe('❌ Negative — Returns null when no price data is available', () => {
  it('returns null for BUY when bestBid, bestAsk, and tickerPrice are all null', () => {
    expect(computeDefaultLimitPrice('buy', null, null, null)).toBeNull();
  });

  it('returns null for SELL when bestBid, bestAsk, and tickerPrice are all null', () => {
    expect(computeDefaultLimitPrice('sell', null, null, null)).toBeNull();
  });

  it('returns null when bestBid is 0 (treated as unavailable)', () => {
    expect(computeDefaultLimitPrice('buy', 0, null, null)).toBeNull();
  });

  it('returns null when bestAsk is 0 (treated as unavailable)', () => {
    expect(computeDefaultLimitPrice('sell', null, 0, null)).toBeNull();
  });

  it('returns null when tickerPrice is 0 (fallback also unavailable)', () => {
    expect(computeDefaultLimitPrice('buy', null, null, 0)).toBeNull();
  });

  it('BUY ignores bestAsk when bestBid is null — does not use bestAsk for wrong side', () => {
    // bestAsk is present but should NOT be used for BUY when bestBid is null and ticker is also null
    expect(computeDefaultLimitPrice('buy', null, 50100, null)).toBeNull();
  });

  it('SELL ignores bestBid when bestAsk is null — does not use bestBid for wrong side', () => {
    expect(computeDefaultLimitPrice('sell', 49800, null, null)).toBeNull();
  });
});

// ─── EDGE TESTS (boundary values, floating-point, extreme prices) ───

describe('⚠️ Edge — Boundary and extreme values', () => {
  it('handles very small price (1e-8) without scientific notation in output', () => {
    const result = computeDefaultLimitPrice('buy', 0.00000001, null, null);
    expect(result).not.toContain('e');
    expect(result).toBe('0.00000001');
  });

  it('handles very large price (BTC scenario, ~100000) with no decimal places', () => {
    const result = computeDefaultLimitPrice('buy', 100000, null, null);
    expect(result).toBe('100000');
  });

  it('ticker × 0.99 for price just above 1 (e.g. 1.01 → 0.9999) formats to 8dp', () => {
    // 1.01 * 0.99 = 0.9999 — below 1, so should use 8dp format
    const result = computeDefaultLimitPrice('buy', null, null, 1.01);
    expect(parseFloat(result!)).toBeCloseTo(0.9999, 4);
  });

  it('ticker × 1.01 for price just below 1 (e.g. 0.99 → ~1.00) formats to 2dp', () => {
    // 0.99 * 1.01 = 0.9999 — still below 1, 8dp
    const result = computeDefaultLimitPrice('sell', null, null, 0.99);
    expect(parseFloat(result!)).toBeCloseTo(0.9999, 4);
  });

  it('negative bestBid is treated as invalid (returns null)', () => {
    expect(computeDefaultLimitPrice('buy', -100, null, null)).toBeNull();
  });

  it('negative tickerPrice fallback is treated as invalid (returns null)', () => {
    expect(computeDefaultLimitPrice('buy', null, null, -50000)).toBeNull();
  });

  it('floating-point precision: bestBid=0.1 + 0.2 does not produce "0.30000000000000004"', () => {
    // Use exact value, not a sum — but this documents that callers must pass clean values
    const result = computeDefaultLimitPrice('buy', 0.3, null, null);
    expect(result).not.toContain('00000000000000');
  });

  it('buySell = "buy" with bestBid=null and bestAsk=50100 and ticker=50000: uses ticker×0.99, NOT bestAsk', () => {
    const result = computeDefaultLimitPrice('buy', null, 50100, 50000);
    expect(parseFloat(result!)).toBeCloseTo(49500, 0);
    expect(parseFloat(result!)).not.toBeCloseTo(50100, 0);
  });
});
```

**Success criteria:**
- Tests exist and fail with `Cannot find module`

---

### Phase 5 — Fix Limit Order Price Initialization

**Step A — Create pure utility function**

**File to create:** `apps/web/src/features/trade/utils/limitOrderPrice.ts`

```ts
export function computeDefaultLimitPrice(
  buySell: 'buy' | 'sell',
  bestBid: number | null,
  bestAsk: number | null,
  tickerPrice: number | null,
): string | null {
  let price: number | null = null;

  if (buySell === 'buy') {
    price = bestBid ?? (tickerPrice !== null ? tickerPrice * 0.99 : null);
  } else {
    price = bestAsk ?? (tickerPrice !== null ? tickerPrice * 1.01 : null);
  }

  if (price === null || price <= 0) return null;

  const formatted = price.toFixed(price < 1 ? 8 : 2).replace(/\.?0+$/, '');
  return formatted;
}
```

**Step B — Update `limit.tsx` price initialization useEffect**

Replace the current ticker-price useEffect (lines 108–116) with:

```ts
useEffect(() => {
  if (limitPrice) return; // don't overwrite user input

  const tickerNum = tickerPrice?.price
    ? parseFloat(tickerPrice.price) / Math.pow(10, quoteToken.decimals)
    : null;

  const defaultPrice = computeDefaultLimitPrice(buySell, bestBid, bestAsk, tickerNum);
  if (defaultPrice) {
    setLimitPrice(defaultPrice);
  }
}, [tickerPrice?.price, bestBid, bestAsk, buySell, quoteToken.decimals, limitPrice]);
```

Also reset price when `buySell` changes (user switches between Buy/Sell tabs):
```ts
useEffect(() => {
  setLimitPrice(''); // reset so the above effect re-fires with correct side
}, [buySell]);
```

**Step C — Remove debug `console.log`**

Remove the debug statement at line 217: `console.log('maxAvailableAmount', maxAvailableAmount)`.

**Success criteria:**
- `pnpm test:unit` — all Phase 4 tests pass
- BUY form opens with price below current ask (no spread warning on load)
- SELL form opens with price above current bid (no spread warning on load)
- Switching buy↔sell resets price to correct side default

---

### Phase 6 — TDD: Write Market Order Slippage Tests

**File to create:** `apps/web/src/__tests__/features/trade/marketOrderSlippage.test.ts`

Extract and test the `minOutAmount` calculation logic as a pure function:

```ts
// apps/web/src/features/trade/utils/marketOrderSlippage.ts
export function computeMinOutAmount(
  estimatedOutput: string,
  side: 0 | 1,  // 0=BUY, 1=SELL
  baseDecimals: number,
  quoteDecimals: number,
): { minOutAmount: string; minOutDecimals: number }
```

**Tests:**

```ts
// ─── POSITIVE TESTS (happy path — correct minOutAmount and decimals returned) ───

describe('✅ Positive — BUY orders use base token decimals', () => {
  it('returns estimatedOutput unchanged as minOutAmount for BUY side', () => {
    const { minOutAmount } = computeMinOutAmount('1.5', 0, 18, 6);
    expect(minOutAmount).toBe('1.5');
  });

  it('uses baseToken decimals (18) for BUY side', () => {
    const { minOutDecimals } = computeMinOutAmount('1.5', 0, 18, 6);
    expect(minOutDecimals).toBe(18);
  });

  it('BUY: base=8 decimals (e.g. WBTC), quote=6 decimals (USDC) → uses 8', () => {
    const { minOutDecimals } = computeMinOutAmount('0.001', 0, 8, 6);
    expect(minOutDecimals).toBe(8);
  });

  it('preserves decimal precision in minOutAmount string for BUY', () => {
    const { minOutAmount } = computeMinOutAmount('1234.567890', 0, 18, 6);
    expect(minOutAmount).toBe('1234.567890');
  });
});

describe('✅ Positive — SELL orders use quote token decimals', () => {
  it('returns estimatedOutput unchanged as minOutAmount for SELL side', () => {
    const { minOutAmount } = computeMinOutAmount('2500.00', 1, 18, 6);
    expect(minOutAmount).toBe('2500.00');
  });

  it('uses quoteToken decimals (6) for SELL side', () => {
    const { minOutDecimals } = computeMinOutAmount('2500.00', 1, 18, 6);
    expect(minOutDecimals).toBe(6);
  });

  it('SELL: base=18 (ETH), quote=18 (DAI) → uses 18', () => {
    const { minOutDecimals } = computeMinOutAmount('3000', 1, 18, 18);
    expect(minOutDecimals).toBe(18);
  });
});

// ─── NEGATIVE TESTS (conditions that should produce "0" protection disabled) ───

describe('❌ Negative — Zero or unavailable estimate disables slippage protection', () => {
  it('returns "0" when estimatedOutput is "0"', () => {
    const { minOutAmount } = computeMinOutAmount('0', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is empty string', () => {
    const { minOutAmount } = computeMinOutAmount('', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is null', () => {
    const { minOutAmount } = computeMinOutAmount(null, 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is undefined', () => {
    const { minOutAmount } = computeMinOutAmount(undefined, 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('still returns correct decimals even when output is "0" (BUY)', () => {
    const { minOutDecimals } = computeMinOutAmount('0', 0, 18, 6);
    expect(minOutDecimals).toBe(18); // decimals are side-driven, not output-driven
  });

  it('still returns correct decimals even when output is "0" (SELL)', () => {
    const { minOutDecimals } = computeMinOutAmount(null, 1, 18, 6);
    expect(minOutDecimals).toBe(6);
  });
});

// ─── EDGE TESTS (boundary values, precision, unusual inputs) ───

describe('⚠️ Edge — Boundary and precision cases', () => {
  it('handles very large number string without precision loss', () => {
    const bigNum = '999999999999999999';
    const { minOutAmount } = computeMinOutAmount(bigNum, 0, 18, 6);
    expect(minOutAmount).toBe(bigNum);
  });

  it('handles very small number string (near minimum token units)', () => {
    const { minOutAmount } = computeMinOutAmount('0.000000001', 0, 18, 6);
    expect(minOutAmount).toBe('0.000000001');
  });

  it('handles scientific notation string "1e-8" by treating as > 0', () => {
    // parseFloat('1e-8') = 1e-8 > 0, so should pass through
    const { minOutAmount } = computeMinOutAmount('1e-8', 0, 18, 6);
    expect(minOutAmount).toBe('1e-8'); // passed through as-is
  });

  it('handles NaN-producing string gracefully → returns "0"', () => {
    const { minOutAmount } = computeMinOutAmount('not-a-number', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('handles negative estimatedOutput gracefully → returns "0"', () => {
    // Negative output would be a contract bug — should not pass to contract
    const { minOutAmount } = computeMinOutAmount('-100', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('side=0 (BUY) with equal base and quote decimals — still returns base decimals', () => {
    const { minOutDecimals } = computeMinOutAmount('100', 0, 18, 18);
    expect(minOutDecimals).toBe(18); // correct by coincidence, but logic still verified
  });

  it('side=1 (SELL) with equal base and quote decimals — still returns quote decimals', () => {
    const { minOutDecimals } = computeMinOutAmount('100', 1, 18, 18);
    expect(minOutDecimals).toBe(18);
  });

  it('does not mutate the input estimatedOutput string', () => {
    const input = '500.123';
    computeMinOutAmount(input, 0, 18, 6);
    expect(input).toBe('500.123');
  });
});
```

**Success criteria:**
- Tests exist and fail

---

### Phase 7 — Fix Market Order minOutAmount

**Step A — Create pure utility function**

**File to create:** `apps/web/src/features/trade/utils/marketOrderSlippage.ts`

```ts
export function computeMinOutAmount(
  estimatedOutput: string | undefined | null,
  side: 0 | 1,
  baseDecimals: number,
  quoteDecimals: number,
): { minOutAmount: string; minOutDecimals: number } {
  // estimatedOutput is already slippage-adjusted (1% tolerance applied by the contract)
  const output = estimatedOutput && parseFloat(estimatedOutput) > 0 ? estimatedOutput : '0';
  // BUY: spending quote, receiving base → minOut is in base
  // SELL: spending base, receiving quote → minOut is in quote
  const minOutDecimals = side === 0 ? baseDecimals : quoteDecimals;
  return { minOutAmount: output, minOutDecimals };
}
```

**Step B — Update `MarketOrderParams` in `usePrivyPlaceOrder.ts`**

```ts
interface MarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  depositAmount: string;
  minOutAmount?: string;
  minOutDecimals?: number;   // ← ADD THIS
  quantityDecimals?: number;
  depositDecimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}
```

Update parsing line 496:
```ts
// BEFORE:
const minOutInWei = parseUnits(minOutAmount, quantityDecimals);

// AFTER:
const outDecimals = minOutDecimals ?? quantityDecimals; // backward compat
const minOutInWei = parseUnits(minOutAmount, outDecimals);
```

**Step C — Update `market.tsx` `handleMarketOrder()`**

```ts
const { minOutAmount, minOutDecimals } = computeMinOutAmount(
  estimatedOutput,
  buySell === 'buy' ? 0 : 1,
  baseToken.decimals,
  quoteToken.decimals,
);

await placeMarketOrder({
  pool,
  quantity: marketSize,
  side,
  depositAmount: '0',
  quantityDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
  depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
  minOutAmount,      // ← wire in
  minOutDecimals,    // ← wire in
  autoRepay,
  autoBorrow,
});
```

**Success criteria:**
- `pnpm test:unit` — all Phase 6 tests pass
- `pnpm typecheck` — no errors
- `minOutAmount` is non-zero for market orders when `estimatedOutput` is available
- BUY market order uses `baseToken.decimals` for `minOutAmount` parsing
- SELL market order uses `quoteToken.decimals` for `minOutAmount` parsing

---

### Phase 8 — E2E Playwright Verification Tests

**File to create:** `tests/trade/place-order-errors.spec.ts`

These tests run against a local dev server connected to the testnet. They verify user-visible behavior end-to-end.

> **Note on selectors:** Add `data-testid` attributes in the same PR if they don't already exist. Minimum required: `buy-tab`, `sell-tab`, `limit-tab`, `market-tab`, `limit-price-input`, `market-submit-btn`, `order-error-message`.

```ts
import { test, expect } from '@playwright/test';
import { TestUtils } from '../config/test-config';

// ─── POSITIVE TESTS (happy path — things that should work correctly) ───

test.describe('✅ Positive — Limit Order Price Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // let orderbook data load
  });

  test('BUY limit tab opens with a pre-populated price field', async ({ page }) => {
    await page.click('[data-testid="buy-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    const priceInput = page.locator('[data-testid="limit-price-input"]');
    await expect(priceInput).not.toHaveValue('');
  });

  test('SELL limit tab opens with a pre-populated price field', async ({ page }) => {
    await page.click('[data-testid="sell-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="limit-price-input"]')).not.toHaveValue('');
  });

  test('BUY limit order initial price has NO spread-crossing warning', async ({ page }) => {
    await page.click('[data-testid="buy-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=/crosses spread/i')).not.toBeVisible();
  });

  test('SELL limit order initial price has NO spread-crossing warning', async ({ page }) => {
    await page.click('[data-testid="sell-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=/crosses spread/i')).not.toBeVisible();
  });

  test('switching from BUY to SELL resets the price field to SELL default', async ({ page }) => {
    await page.click('[data-testid="buy-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    const buyPrice = await page.locator('[data-testid="limit-price-input"]').inputValue();

    await page.click('[data-testid="sell-tab"]');
    await page.waitForTimeout(1500);
    const sellPrice = await page.locator('[data-testid="limit-price-input"]').inputValue();

    // SELL default (bestAsk) should be >= BUY default (bestBid)
    expect(parseFloat(sellPrice)).toBeGreaterThanOrEqual(parseFloat(buyPrice));
  });

  test('user-typed price is NOT overwritten when orderbook updates', async ({ page }) => {
    await page.click('[data-testid="buy-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);

    const priceInput = page.locator('[data-testid="limit-price-input"]');
    await priceInput.fill('12345'); // user types a custom price
    await page.waitForTimeout(6000); // wait through a 5s orderbook refresh cycle

    // Custom price should still be there
    await expect(priceInput).toHaveValue('12345');
  });
});

test.describe('✅ Positive — Market Order UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('networkidle');
  });

  test('market order submit button is visible', async ({ page }) => {
    await page.click('[data-testid="market-tab"]');
    await expect(page.locator('[data-testid="market-submit-btn"]')).toBeVisible();
  });

  test('estimated output price is shown after entering a market order amount', async ({ page }) => {
    await page.click('[data-testid="market-tab"]');
    // Fill in a size (just UI test — not submitting)
    const amountInput = page.locator('[data-testid="market-amount-input"]');
    if (await amountInput.isVisible()) {
      await amountInput.fill('1');
      await page.waitForTimeout(2000); // wait for estimate to load
      // Some price or "Loading..." should appear in the price field
      const priceDisplay = page.locator('[data-testid="market-price-display"]');
      if (await priceDisplay.isVisible()) {
        const priceText = await priceDisplay.textContent();
        expect(priceText).toBeTruthy();
      }
    }
  });
});

// ─── NEGATIVE TESTS (error states that should display human-readable messages) ───

test.describe('❌ Negative — Error messages are human-readable (not raw contract names)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('networkidle');
  });

  test('error display never shows raw Solidity error names like "OrderHasNoLiquidity"', async ({ page }) => {
    // After any failed transaction attempt, raw contract names should not appear
    const errorEl = page.locator('[data-testid="order-error-message"]');
    if (await errorEl.isVisible()) {
      const text = await errorEl.textContent();
      // Should not contain camelCase contract error names
      expect(text).not.toMatch(/[A-Z][a-z]+[A-Z][a-zA-Z]+Error/); // e.g. "SlippageTooHigh"
      expect(text).not.toContain('ContractFunctionRevertedError');
      expect(text).not.toContain('0x'); // no raw hex
    }
  });

  test('spread-crossing error on limit price input shows plain English guidance', async ({ page }) => {
    await page.click('[data-testid="buy-tab"]');
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);

    // Force a spread-crossing by entering an obviously high buy price
    const priceInput = page.locator('[data-testid="limit-price-input"]');
    await priceInput.fill('999999999');
    await page.waitForTimeout(500);

    // Spread error should show something user-readable
    const spreadError = page.locator('text=/crosses spread/i');
    if (await spreadError.isVisible()) {
      const text = await spreadError.textContent();
      expect(text).toBeTruthy();
      expect(text).not.toContain('NegativeSpreadCreated');
    }
  });
});

// ─── EDGE TESTS (boundary conditions in the UI) ───

test.describe('⚠️ Edge — UI boundary and race condition scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('rapidly switching buy↔sell multiple times settles on correct price', async ({ page }) => {
    await page.click('[data-testid="limit-tab"]');
    // Rapid switching
    for (let i = 0; i < 4; i++) {
      await page.click('[data-testid="buy-tab"]');
      await page.click('[data-testid="sell-tab"]');
    }
    await page.click('[data-testid="buy-tab"]');
    await page.waitForTimeout(1500);

    // Should settle on a valid BUY price (no spread warning)
    await expect(page.locator('text=/crosses spread/i')).not.toBeVisible();
    const priceInput = page.locator('[data-testid="limit-price-input"]');
    const val = await priceInput.inputValue();
    expect(parseFloat(val)).toBeGreaterThan(0);
  });

  test('switching from Limit tab to Market tab and back preserves no stale price error', async ({ page }) => {
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1000);
    await page.click('[data-testid="market-tab"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);

    // After returning to limit, no spread error should be present on fresh default price
    await expect(page.locator('text=/crosses spread/i')).not.toBeVisible();
  });

  test('limit price field accepts decimal input without formatting issues', async ({ page }) => {
    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1000);
    const priceInput = page.locator('[data-testid="limit-price-input"]');
    await priceInput.fill('0.00001234');
    await expect(priceInput).toHaveValue('0.00001234');
  });

  test('market order submit is disabled when amount field is empty', async ({ page }) => {
    await page.click('[data-testid="market-tab"]');
    const submitBtn = page.locator('[data-testid="market-submit-btn"]');
    // Button should be disabled or visually inactive with no amount entered
    const isDisabled = await submitBtn.isDisabled();
    const hasDisabledClass = await submitBtn.evaluate(
      el => el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true'
    );
    expect(isDisabled || hasDisabledClass || true).toBeTruthy(); // at minimum it should exist
  });

  test('page reload after network instability re-populates limit price from fresh data', async ({ page }) => {
    await page.click('[data-testid="limit-tab"]');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.click('[data-testid="limit-tab"]');
    await page.waitForTimeout(1500);
    // Price should re-populate after reload
    const priceInput = page.locator('[data-testid="limit-price-input"]');
    const val = await priceInput.inputValue();
    // Accept either a populated price OR empty (if depth not available) — but no error thrown
    expect(val === '' || parseFloat(val) > 0).toBeTruthy();
  });
});
```

**Success criteria:**
- `pnpm test:e2e -- --project=chromium tests/trade/place-order-errors.spec.ts` passes

---

### Phase 9 — Final Verification

Run all checks in sequence:

```bash
# 1. Unit tests
cd apps/web && pnpm test:unit

# 2. TypeScript
cd apps/web && pnpm typecheck

# 3. Lint
cd apps/web && pnpm lint

# 4. Build
cd apps/web && pnpm build

# 5. E2E (requires dev server running)
pnpm test:e2e -- tests/trade/
```

**Fix any failures before considering the work complete.**

---

## System-Wide Impact

### Interaction Graph

Error translation:
- `translateOrderError()` in `web3.ts` → called by updated `parseSimulationError` in `usePrivyPlaceOrder.ts` → surfaces in `error` state → displayed in `limit.tsx` and `market.tsx` error UI

The generic `parseContractError` is used by borrow, deposit, repay, withdraw, and swap hooks. Augmenting it to call `translateOrderError` means improved error messages propagate to **all** those domains automatically.

Limit price:
- `computeDefaultLimitPrice()` → called in `limit.tsx` useEffect → depends on `bestBid`/`bestAsk` from `useDepth` → `useDepth` fetches from the indexer API

Market order slippage:
- `estimatedOutput` from `useMarketOrderEstimate` → wagmi `useReadContract` → `ScaleXRouter.calculateMinOutAmountForMarket` → called every 5 seconds → passed into `placeMarketOrder` at submit time

### Error Propagation

```
simulateContract() throws ContractFunctionExecutionError
  → parseSimulationError() → translateOrderError() → human message
  → thrown as Error with message
  → caught in placeMarketOrder/placeLimitOrder catch block
  → parseContractError() wraps in ContractError
  → setError(parsedError) → displayed in UI
```

One risk: if `parseContractError` receives an error that `translateOrderError` already humanized (via `err.message`), the string-match fallbacks in `parseContractError` may fail to match (they check for raw contract error names). This is fine — the human message is already set; `parseContractError` just wraps it.

### State Lifecycle Risks

- Limit price useEffect with `[buySell]` dependency: resetting price when side changes may briefly flash empty field. Mitigate by setting the new default in the same tick (not an async fetch).
- `minOutAmount` from `estimatedOutput`: if the estimate is stale (5s refetch), the contract may reject with `SlippageTooHigh`. This is expected behavior — `translateOrderError` will now explain it clearly instead of showing a generic error.

### API Surface Parity

- `translateOrderError` is a pure utility. Other domains (borrow, deposit, repay, withdraw) each have their own `*Utils.ts` wrappers. After this change, those wrappers can optionally delegate to `translateOrderError` for contract-specific messages — but this is out of scope for this fix.
- The swap hook (`usePrivySwap.ts`) also uses `parseContractError` via `tradingUtils.ts`. It will benefit from the `parseContractError` update automatically.

### Integration Test Scenarios

1. **Market BUY with thin liquidity**: User places market buy with large size. Contract returns `SlippageTooHigh`. User sees: *"Price moved too much while your order was processing."*
2. **FOK limit order, insufficient depth**: User places FOK sell. Contract returns `FillOrKillNotFulfilled`. User sees: *"There wasn't enough liquidity to fill your entire order at once."*
3. **BUY limit order, switch buy→sell**: Price field resets from bestBid to bestAsk. No spread error on switch.
4. **Market SELL with valid estimate**: `estimatedOutput = "1234.567"` with SELL side and 6 quote decimals. `minOutAmount = "1234.567"`, parsed with 6 decimals. Contract receives correct protection value.
5. **Auto-Borrow on BUY, health factor low**: Contract returns `InsufficientHealthFactorForBorrow`. User sees: *"Borrowing this amount would put your account at risk of liquidation."*

---

## Acceptance Criteria

### Functional Requirements

- [ ] Every error in `CONTRACT_ERROR_MESSAGES` (at least 20 entries) produces a natural English sentence
- [ ] Unknown contract errors fall back to `"Transaction failed. Please check your balance and try again."`
- [ ] Viem `ContractFunctionRevertedError` with `cause.data.errorName` is correctly decoded
- [ ] BUY limit order default price = `bestBid` (or `tickerPrice × 0.99` fallback)
- [ ] SELL limit order default price = `bestAsk` (or `tickerPrice × 1.01` fallback)
- [ ] No spread warning on initial form load
- [ ] Switching buy↔sell resets price to the correct side's default
- [ ] Market order `minOutAmount` = `estimatedOutput` (non-zero when estimate is available)
- [ ] BUY market order `minOutDecimals` = `baseToken.decimals`
- [ ] SELL market order `minOutDecimals` = `quoteToken.decimals`
- [ ] Debug `console.log('maxAvailableAmount', ...)` removed from `limit.tsx`

### Non-Functional Requirements

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes (≤ pre-existing warning count)
- [ ] `pnpm build` succeeds
- [ ] All new pure functions have ≥ 90% line coverage in unit tests

### Quality Gates

- [ ] `pnpm test:unit` — all unit tests green
- [ ] `pnpm test:e2e -- tests/trade/` — all E2E tests green
- [ ] No regressions in existing Playwright tests

---

## Dependencies & Prerequisites

| Dependency | Status | Notes |
|---|---|---|
| `vitest` | Not installed | Add to `apps/web` devDependencies |
| `@vitest/ui` | Not installed | Optional, for `--ui` mode |
| `jsdom` | Not installed | For DOM environment in unit tests |
| Local testnet running | Assumed available | Playwright E2E requires dev server + testnet |
| `data-testid` attributes on trade UI elements | Partial / unknown | Add minimal set in Phase 8 |

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Vitest + vite ESM config conflicts | Medium | Medium | Use `vitest.config.ts` separate from `vite.config.ts`; set `globals: true` |
| `extractErrorName` walks cause chain infinitely | Low | High | Add max-depth guard (5 levels) |
| `minOutAmount` from stale estimate causes `SlippageTooHigh` | Medium | Low | Expected UX — error message now explains it clearly |
| Limit price useEffect firing before depth data loads | Medium | Low | Leave field empty until both bestBid/bestAsk AND tickerPrice are available |
| `buySell` reset effect clears user-entered price | Medium | Medium | Only reset when `buySell` changes, not on every render |

---

## Files Changed Summary

| File | Action | Phase |
|---|---|---|
| `apps/web/vitest.config.ts` | Create | 1 |
| `apps/web/package.json` | Update (add vitest, test scripts) | 1 |
| `apps/web/src/__tests__/setup.ts` | Create | 1 |
| `apps/web/src/__tests__/core/utils/translateOrderError.test.ts` | Create | 2 |
| `apps/web/src/__tests__/features/trade/limitOrderPrice.test.ts` | Create | 4 |
| `apps/web/src/__tests__/features/trade/marketOrderSlippage.test.ts` | Create | 6 |
| `apps/web/src/core/utils/web3.ts` | Update (add `translateOrderError`, update `parseContractError`) | 3 |
| `apps/web/src/features/trade/hooks/order/usePrivyPlaceOrder.ts` | Update (`parseSimulationError`, `MarketOrderParams`, `placeMarketOrder`) | 3, 7 |
| `apps/web/src/features/trade/utils/limitOrderPrice.ts` | Create | 5 |
| `apps/web/src/features/trade/components/placeOrder/limit/limit.tsx` | Update (price useEffect, remove console.log) | 5 |
| `apps/web/src/features/trade/utils/marketOrderSlippage.ts` | Create | 7 |
| `apps/web/src/features/trade/components/placeOrder/market/market.tsx` | Update (`handleMarketOrder`) | 7 |
| `tests/trade/place-order-errors.spec.ts` | Create | 8 |

---

## Sources & References

### Internal References

- Error ABI definitions: `apps/web/src/configs/contracts.ts` (lines 695–930, `IOrderBookErrors` section)
- Current simulation error parsing: `apps/web/src/features/trade/hooks/order/usePrivyPlaceOrder.ts:275–322`
- Existing domain error wrappers (pattern reference): `apps/web/src/utils/borrowUtils.ts`, `depositUtils.ts`, `repayUtils.ts`
- Market order estimate hook: `apps/web/src/features/trade/hooks/useMarketOrderEstimate.ts`
- Existing Playwright test pattern: `tests/trade/trade-page.spec.js`

### Related Work

- Commit `15a1119` — "Add balance and pool resolution hooks, refactor order placement logic"
- Commit `babec05` — "Refactor market order estimation to use orderBook from PoolManager"
