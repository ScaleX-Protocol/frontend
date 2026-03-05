export interface ProjectedEarnings {
  hourly: string;
  daily: string;
  weekly: string;
  monthly: string;
}

export interface RealTimeRates {
  supplyAPY: string;
  borrowAPY: string;
  utilizationRate: string;
}

export interface AccruedYield {
  amount: string;
  value: string;
  sinceTimestamp: number;
  duration: string;
}

export interface AccruedInterest {
  amount: string;
  value: string;
  sinceTimestamp: number;
  duration: string;
}

export interface LendingSupply {
  id: string;
  asset: string;
  assetAddress: string;
  suppliedAmount: string;
  currentValue: string;
  apy: string;
  earnings: string;
  projectedEarnings: ProjectedEarnings;
  accruedYield: AccruedYield;
  canWithdraw: boolean;
  collateralUsed: string;
  utilizationRate: string;
  realTimeRates: RealTimeRates;
}

export interface LendingBorrow {
  id: string;
  asset: string;
  assetAddress: string;
  borrowedAmount: string;
  currentDebt: string;
  apy: string;
  interestAccrued: string;
  accruedInterest: AccruedInterest;
  collateralRatio: string;
  healthFactor: string;
  healthStatus: 'safe' | 'warning' | 'danger';
  canRepay: boolean;
}

export interface AvailableToSupply {
  asset: string;
  assetAddress: string;
  userBalance: string;
  suppliedAmount: string;
  availableAmount: string;
  apy: string;
  utilizationRate: string;
  projectedEarnings: ProjectedEarnings | null;
  canSupply: boolean;
  recommended: boolean;
  realTimeRates: RealTimeRates | null;
}

export interface ProjectedInterest {
  hourly: string;
  daily: string;
  weekly: string;
  monthly: string;
}

export interface AvailableToBorrow {
  asset: string;
  assetAddress: string;
  availableAmount: string;
  availableLiquidity: string;
  currentBorrowed: string;
  apy: string;
  utilizationRate: string;
  projectedInterest: ProjectedInterest | null;
  collateralFactor: string;
  liquidationThreshold: string;
  canBorrow: boolean;
  recommended: boolean;
  realTimeRates: RealTimeRates | null;
}

export interface LendingSummary {
  totalSupplied: string;
  totalBorrowed: string;
  netAPY: string;
  totalEarnings: string;
  healthFactor: string;
  borrowingPower: string;
}

export interface ActivityHistory {
  // EVM actions (uppercase) + Solana indexer actions (PascalCase)
  // EVM: uppercase  |  Solana: PascalCase (confirmed from live devnet API)
  action: 'SUPPLY' | 'WITHDRAW' | 'BORROW' | 'REPAY' | 'Deposit' | 'Withdraw' | 'Borrow' | 'Repay' | 'Liquidate';
  amount: string;
  token: string;
  tokenAddress: string;
  timestamp: number;
  blockNumber: string;
  transactionId: string;
  createdAt: string;
  duration?: string;
}

export interface InterestRateParams {
  token: string;
  tokenAddress: string;
  baseRate: string;
  optimalUtilization: string;
  rateSlope1: string;
  rateSlope2: string;
  lastUpdated: string;
}

export interface AssetConfiguration {
  token: string;
  tokenAddress: string;
  collateralFactor: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  reserveFactor: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface LendingDashboard {
  supplies: LendingSupply[];
  borrows: LendingBorrow[];
  availableToSupply: AvailableToSupply[];
  availableToBorrow: AvailableToBorrow[];
  activityHistory: ActivityHistory[];
  // Optional — absent in Solana indexer response; derived client-side via deriveLendingSummary()
  interestRateParams?: InterestRateParams[];
  assetConfigurations?: AssetConfiguration[];
  summary?: LendingSummary;
}
