import { View, Text, StyleSheet } from 'react-native';

// Import all SVG files as React components
import SxUSDC from '~/assets/tokens/sxUSDC.svg';
import SxWETH from '~/assets/tokens/sxWETH.svg';
import SxWBTC from '~/assets/tokens/sxWBTC.svg';
import SxMNT from '~/assets/tokens/sxMNT.svg';
import SxIDRX from '~/assets/tokens/sxIDRX.svg';
import SxXAU from '~/assets/tokens/sxXAU.svg';
import SxXAG from '~/assets/tokens/sxXAG.svg';
import SxNVDA from '~/assets/tokens/sxNVDA.svg';
import SxAAPL from '~/assets/tokens/sxAAPL.svg';
import SxGOOGL from '~/assets/tokens/sxGOOGL.svg';
import USDC from '~/assets/tokens/usd-coin-usdc-logo.svg';
import WETH from '~/assets/tokens/ethereum-eth-logo.svg';
import WBTC from '~/assets/tokens/bitcoin-btc-logo.svg';
import MNT from '~/assets/tokens/mantle-mnt-logo.svg';
import IDRX from '~/assets/tokens/IDRX.svg';
import XAU from '~/assets/tokens/XAU.svg';
import XAG from '~/assets/tokens/XAG.svg';
import NVDA from '~/assets/tokens/NVDA.svg';
import AAPL from '~/assets/tokens/AAPL.svg';
import GOOGL from '~/assets/tokens/GOOGL.svg';
import DefaultIcon from '~/assets/tokens/default-token.svg';

interface TokenIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Size configuration
const SIZE_CONFIG = {
  xs: { container: 20 },
  sm: { container: 24 },
  md: { container: 32 },
  lg: { container: 40 },
  xl: { container: 48 },
} as const;

// SVG component mapping
const SVG_COMPONENTS: Record<string, React.ComponentType<any>> = {
  sxUSDC: SxUSDC,
  sxWETH: SxWETH,
  sxWBTC: SxWBTC,
  sxMNT: SxMNT,
  sxIDRX: SxIDRX,
  sxXAU: SxXAU,
  sxXAG: SxXAG,
  sxNVDA: SxNVDA,
  sxAAPL: SxAAPL,
  sxGOOGL: SxGOOGL,
  USDC: USDC,
  WETH: WETH,
  WBTC: WBTC,
  MNT: MNT,
  IDRX: IDRX,
  XAU: XAU,
  XAG: XAG,
  NVDA: NVDA,
  AAPL: AAPL,
  GOOGL: GOOGL,
};

// Get the SVG component for a token
const getTokenIcon = (symbol: string): React.ComponentType<any> => {
  // Try exact match first
  if (SVG_COMPONENTS[symbol]) {
    return SVG_COMPONENTS[symbol];
  }

  // Handle sx prefix - try stripping it and looking up base symbol
  if (symbol.startsWith('sx')) {
    const baseSymbol = symbol.substring(2);
    if (SVG_COMPONENTS[baseSymbol]) {
      return SVG_COMPONENTS[baseSymbol];
    }
  }

  // Try with "sx" prefix if not found (for base symbols)
  const withPrefix = `sx${symbol}`;
  if (SVG_COMPONENTS[withPrefix]) {
    return SVG_COMPONENTS[withPrefix];
  }

  return DefaultIcon;
};

export function TokenIcon({ symbol, size = 'md' }: TokenIconProps) {
  const config = SIZE_CONFIG[size];
  const IconComponent = getTokenIcon(symbol);

  return (
    <View
      style={[
        styles.container,
        {
          width: config.container,
          height: config.container,
        },
      ]}
    >
      <IconComponent
        width="100%"
        height="100%"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default TokenIcon;
