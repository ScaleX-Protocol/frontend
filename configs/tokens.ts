import type { AvailableToBorrow } from '@/features/lending/types/lending.types';

export interface TokenIconConfig {
  [symbol: string]: string;
}

export const TOKEN_ICONS: TokenIconConfig = {
  gsUSDC: '/tokens/usd-coin-usdc-logo.svg',
  gsWETH: '/tokens/ethereum-eth-logo.svg',
  gsWBTC: '/tokens/bitcoin-btc-logo.svg',
};

// Helper function to get token icon path
export const getTokenIcon = (symbol: string): string => {
  return TOKEN_ICONS[symbol] || '/tokens/default-token.svg';
};

// Fallback data for available to borrow when API returns empty
export const FALLBACK_AVAILABLE_TO_BORROW: AvailableToBorrow[] = [
  {
    asset: "USDC",
    assetAddress: "0x44e9f25dcc735fceabc6c784046722bca5bbccb5",
    availableAmount: "250,000.00",
    currentBorrowed: "45,500.00",
    apy: "3.2%",
    collateralFactor: "80",
    liquidationThreshold: "85",
    canBorrow: true,
    recommended: true
  },
  {
    asset: "WETH",
    assetAddress: "0xcf6c841fe5aee3ddeeeb87deff52ccf72e4649ad",
    availableAmount: "125.50",
    currentBorrowed: "28.75",
    apy: "4.8%",
    collateralFactor: "75",
    liquidationThreshold: "80",
    canBorrow: true,
    recommended: false
  },
  {
    asset: "WBTC",
    assetAddress: "0x97f31dd7049ff8a7736f8d28f0714d7571bd80fc",
    availableAmount: "15.25",
    currentBorrowed: "3.10",
    apy: "5.5%",
    collateralFactor: "70",
    liquidationThreshold: "75",
    canBorrow: true,
    recommended: false
  }
];