const UINT256_MAX = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export interface PolicyTemplate {
  name: string;
  description: string;
  details: string[];
  policy: PolicyStruct;
}

export interface PolicyStruct {
  enabled: boolean;
  installedAt: bigint;
  expiryTimestamp: bigint;
  maxOrderSize: bigint;
  minOrderSize: bigint;
  whitelistedTokens: readonly `0x${string}`[];
  blacklistedTokens: readonly `0x${string}`[];
  allowMarketOrders: boolean;
  allowLimitOrders: boolean;
  allowSwap: boolean;
  allowBorrow: boolean;
  allowRepay: boolean;
  allowSupplyCollateral: boolean;
  allowWithdrawCollateral: boolean;
  allowPlaceLimitOrder: boolean;
  allowCancelOrder: boolean;
  allowPredict: boolean;
  allowClaimPrediction: boolean;
  maxPredictionStake: bigint;
  allowBuy: boolean;
  allowSell: boolean;
  allowAutoBorrow: boolean;
  maxAutoBorrowAmount: bigint;
  allowAutoRepay: boolean;
  minDebtToRepay: bigint;
  minHealthFactor: bigint;
  maxSlippageBps: bigint;
  minTimeBetweenTrades: bigint;
  emergencyRecipient: `0x${string}`;
  dailyVolumeLimit: bigint;
  weeklyVolumeLimit: bigint;
  maxDailyDrawdown: bigint;
  maxWeeklyDrawdown: bigint;
  maxTradeVsTVLBps: bigint;
  minWinRateBps: bigint;
  minSharpeRatio: bigint;
  maxPositionConcentrationBps: bigint;
  maxCorrelationBps: bigint;
  maxTradesPerDay: bigint;
  maxTradesPerHour: bigint;
  tradingStartHour: bigint;
  tradingEndHour: bigint;
  minReputationScore: bigint;
  useReputationMultiplier: boolean;
  requiresChainlinkFunctions: boolean;
}

function createBasePolicy(): PolicyStruct {
  return {
    enabled: true,
    installedAt: BigInt(Math.floor(Date.now() / 1000)),
    expiryTimestamp: UINT256_MAX,
    maxOrderSize: UINT256_MAX,
    minOrderSize: 0n,
    whitelistedTokens: [],
    blacklistedTokens: [],
    allowMarketOrders: true,
    allowLimitOrders: true,
    allowSwap: true,
    allowBorrow: false,
    allowRepay: false,
    allowSupplyCollateral: false,
    allowWithdrawCollateral: false,
    allowPlaceLimitOrder: true,
    allowCancelOrder: true,
    allowPredict: false,
    allowClaimPrediction: false,
    maxPredictionStake: 0n,
    allowBuy: true,
    allowSell: true,
    allowAutoBorrow: false,
    maxAutoBorrowAmount: 0n,
    allowAutoRepay: false,
    minDebtToRepay: 0n,
    minHealthFactor: BigInt('1500000000000000000'), // 150%
    maxSlippageBps: 100n, // 1%
    minTimeBetweenTrades: 300n, // 5 minutes
    emergencyRecipient: ZERO_ADDRESS,
    dailyVolumeLimit: 0n,
    weeklyVolumeLimit: 0n,
    maxDailyDrawdown: 0n,
    maxWeeklyDrawdown: 0n,
    maxTradeVsTVLBps: 0n,
    minWinRateBps: 0n,
    minSharpeRatio: 0n,
    maxPositionConcentrationBps: 0n,
    maxCorrelationBps: 10000n,
    maxTradesPerDay: 0n,
    maxTradesPerHour: 0n,
    tradingStartHour: 0n,
    tradingEndHour: 23n,
    minReputationScore: 0n,
    useReputationMultiplier: false,
    requiresChainlinkFunctions: false,
  };
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    name: 'Conservative',
    description: 'Small order sizes, no borrowing, tight slippage, limited trading hours',
    details: [
      'Max order: 10,000 IDRX',
      'Slippage: 0.5%',
      'No borrowing',
      '10 trades/day',
      'Hours: 08:00–20:00',
    ],
    policy: {
      ...createBasePolicy(),
      maxOrderSize: BigInt('10000000000'), // 10,000 IDRX
      maxSlippageBps: 50n, // 0.5%
      minTimeBetweenTrades: 600n, // 10 minutes
      maxTradesPerDay: 10n,
      maxTradesPerHour: 3n,
      tradingStartHour: 8n,
      tradingEndHour: 20n,
    },
  },
  {
    name: 'Moderate',
    description: 'Medium limits, borrowing allowed with health factor guard',
    details: [
      'Max order: 100,000 IDRX',
      'Slippage: 3%',
      'Auto-borrow up to 5,000 IDRX',
      'Min health factor: 130%',
      'Min 2 min between trades',
    ],
    policy: {
      ...createBasePolicy(),
      maxOrderSize: BigInt('100000000000'), // 100,000 IDRX
      allowBorrow: true,
      allowRepay: true,
      allowSupplyCollateral: true,
      allowWithdrawCollateral: true,
      allowAutoBorrow: true,
      maxAutoBorrowAmount: BigInt('5000000000'), // 5,000 IDRX
      allowAutoRepay: true,
      minDebtToRepay: BigInt('100000000'), // 100 IDRX
      minHealthFactor: BigInt('1300000000000000000'), // 130%
      maxSlippageBps: 300n, // 3%
      minTimeBetweenTrades: 120n, // 2 minutes
    },
  },
  {
    name: 'Aggressive',
    description: 'Large limits, all permissions, wide slippage tolerance',
    details: [
      'Max order: Unlimited',
      'Slippage: 5%',
      'Auto-borrow up to 50,000 IDRX',
      'Min health factor: 110%',
      'Min 1 min between trades',
    ],
    policy: {
      ...createBasePolicy(),
      maxOrderSize: UINT256_MAX,
      allowBorrow: true,
      allowRepay: true,
      allowSupplyCollateral: true,
      allowWithdrawCollateral: true,
      allowAutoBorrow: true,
      maxAutoBorrowAmount: BigInt('50000000000'), // 50,000 IDRX
      allowAutoRepay: true,
      minDebtToRepay: BigInt('100000000'),
      minHealthFactor: BigInt('1100000000000000000'), // 110%
      maxSlippageBps: 500n, // 5%
      minTimeBetweenTrades: 60n, // 1 minute
    },
  },
];
