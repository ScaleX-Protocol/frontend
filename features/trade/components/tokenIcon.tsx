import Image from 'next/image';

interface TokenIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const TokenSVG: Record<string, string> = {
  gsUSDC: '/tokens/usd-coin-usdc-logo.svg',
  gsWETH: '/tokens/ethereum-eth-logo.svg',
  gsWBTC: '/tokens/bitcoin-btc-logo.svg',
  USDC: '/tokens/usd-coin-usdc-logo.svg',
  WETH: '/tokens/ethereum-eth-logo.svg',
  WBTC: '/tokens/bitcoin-btc-logo.svg',
};

export function TokenIcon({ symbol, size = 'md' }: TokenIconProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center relative`}>
      <Image src={TokenSVG[symbol]} alt="Token Icon" fill layout="fill" objectFit="contain" />
    </div>
  );
}
