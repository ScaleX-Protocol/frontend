export interface LendingSupply {
  id: string;
  asset: string;
  assetAddress: string;
  suppliedAmount: string;
  currentValue: string;
  apy: string;
  earnings: string;
  canWithdraw: boolean;
  collateralUsed: string;
}

export interface LendingBorrow {
  id: string;
  asset: string;
  assetAddress: string;
  borrowedAmount: string;
  currentDebt: string;
  apy: string;
  interestAccrued: string;
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
  canSupply: boolean;
  recommended: boolean;
}

export interface AvailableToBorrow {
  asset: string;
  assetAddress: string;
  availableAmount: string;
  currentBorrowed: string;
  apy: string;
  collateralFactor: string;
  liquidationThreshold: string;
  canBorrow: boolean;
  recommended: boolean;
}

export interface LendingSummary {
  totalSupplied: string;
  totalBorrowed: string;
  netAPY: string;
  totalEarnings: string;
  healthFactor: string;
  borrowingPower: string;
}

export interface LendingDashboard {
  supplies: LendingSupply[];
  borrows: LendingBorrow[];
  availableToSupply: AvailableToSupply[];
  availableToBorrow: AvailableToBorrow[];
  summary: LendingSummary;
}
