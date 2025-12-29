export interface TokenIconConfig {
  [symbol: string]: string;
}

export const TOKEN_ICONS: TokenIconConfig = {
  gsUSDC: '/tokens/gsUSDC.png',
  gsWETH: '/tokens/gsWETH.png',
  gsWBTC: '/tokens/gsWBTC.png',
  USDC: '/tokens/usd-coin-usdc-logo.svg',
  WETH: '/tokens/ethereum-eth-logo.svg',
  WBTC: '/tokens/bitcoin-btc-logo.svg',
};

// Helper function to get token icon path
export const getTokenIcon = (symbol: string): string => {
  // Try exact match first
  if (TOKEN_ICONS[symbol]) {
    return TOKEN_ICONS[symbol];
  }

  // Try with "gs" prefix if not found
  const withPrefix = `gs${symbol}`;
  if (TOKEN_ICONS[withPrefix]) {
    return TOKEN_ICONS[withPrefix];
  }

  // Try without "gs" prefix if symbol starts with "gs"
  if (symbol.startsWith('gs')) {
    const withoutPrefix = symbol.substring(2);
    if (TOKEN_ICONS[withoutPrefix]) {
      return TOKEN_ICONS[withoutPrefix];
    }
  }

  return '/tokens/default-token.svg';
};