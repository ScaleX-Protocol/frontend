export interface TokenIconConfig {
  [symbol: string]: string;
}

export const TOKEN_ICONS: TokenIconConfig = {
  // Synthetic tokens (sx prefix)
  sxUSDC: '/tokens/sxUSDC.svg',
  sxWETH: '/tokens/sxWETH.svg',
  sxWBTC: '/tokens/sxWBTC.svg',
  sxMNT: '/tokens/sxMNT.svg',
  sxIDRX: '/tokens/sxIDRX.svg',
  sxGOLD: '/tokens/sxXAU.svg',
  sxSILVER: '/tokens/sxXAG.svg',
  sxNVIDIA: '/tokens/sxNVDA.svg',
  sxAPPLE: '/tokens/sxAAPL.svg',
  sxGOOGLE: '/tokens/sxGOOGL.svg',
  // Base tokens
  USDC: '/tokens/usd-coin-usdc-logo.svg',
  WETH: '/tokens/ethereum-eth-logo.svg',
  WBTC: '/tokens/bitcoin-btc-logo.svg',
  MNT: '/tokens/mantle-mnt-logo.svg',
  IDRX: '/tokens/IDRX.svg',
  GOLD: '/tokens/XAU.svg',
  SILVER: '/tokens/XAG.svg',
  NVDA: '/tokens/NVDA.svg',
  AAPL: '/tokens/AAPL.svg',
  GOOGL: '/tokens/GOOGL.svg',
};

// Helper function to get token icon path
export const getTokenIcon = (symbol: string): string => {
  // Try exact match first
  if (TOKEN_ICONS[symbol]) {
    return TOKEN_ICONS[symbol];
  }

  // Handle sx prefix - try stripping it and looking up base symbol
  if (symbol.startsWith('sx')) {
    const baseSymbol = symbol.substring(2);
    // Try the base symbol directly
    if (TOKEN_ICONS[baseSymbol]) {
      return TOKEN_ICONS[baseSymbol];
    }
  }

  // Try with "sx" prefix if not found (for base symbols)
  const withPrefix = `sx${symbol}`;
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