import { NextResponse } from 'next/server';

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  poolId: string;
  baseDecimals: number;
  quoteDecimals: number;
}

export interface Market extends TradingPair {
  volume: string;
  volumeInQuote: string;
  latestPrice: string;
  age: number;
  bidLiquidity: string;
  askLiquidity: string;
  totalLiquidityInQuote: string;
  createdAt: number;
}

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const markets: Market[] = [
    {
      symbol: 'gsWBTCgsUSDC',
      baseAsset: 'gsWBTC',
      quoteAsset: 'gsUSDC',
      poolId: 'd4e9af22b490b35bc5bebb6036644e54b11af5711ba8d79e05c7e3f8098b65cd',
      baseDecimals: 8,
      quoteDecimals: 6,
      volume: '0',
      volumeInQuote: '0',
      latestPrice: '0',
      age: 703823,
      bidLiquidity: '0',
      askLiquidity: '0',
      totalLiquidityInQuote: '0',
      createdAt: 1763382190,
    },
    {
      symbol: 'gsWETHgsUSDC',
      baseAsset: 'gsWETH',
      quoteAsset: 'gsUSDC',
      poolId: '0e8a870fae2e832b4ea885fb193b6d7c66050ae6932376705dce03c99b4f2a18',
      baseDecimals: 18,
      quoteDecimals: 6,
      volume: '45000000000000000',
      volumeInQuote: '87300000',
      latestPrice: '1900000000',
      age: 61455,
      bidLiquidity: '9500000000000000000',
      askLiquidity: '25562100000000000000',
      totalLiquidityInQuote: '27632500000000000000000000000',
      createdAt: 1764024558,
    },
  ];

  return NextResponse.json(markets);
}
