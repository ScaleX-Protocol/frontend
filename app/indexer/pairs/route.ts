import { NextResponse } from 'next/server';

// --- Interfaces for Trading Pair Data ---

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  poolId: string;
  baseDecimals: number;
  quoteDecimals: number;
}

// --- Static Mock Data ---
const MOCK_PAIRS_DATA: TradingPair[] = [
  {
    symbol: 'gsWBTCgsUSDC',
    baseAsset: 'gsWBTC',
    quoteAsset: 'gsUSDC',
    poolId: 'd4e9af22b490b35bc5bebb6036644e54b11af5711ba8d79e05c7e3f8098b65cd',
    baseDecimals: 8,
    quoteDecimals: 6,
  },
  {
    symbol: 'gsWETHgsUSDC',
    baseAsset: 'gsWETH',
    quoteAsset: 'gsUSDC',
    poolId: '0e8a870fae2e832b4ea885fb193b6d7c66050ae6932376705dce03c99b4f2a18',
    baseDecimals: 18,
    quoteDecimals: 6,
  },
];

/**
 * Handles GET requests to /api/pairs.
 * Fetches the static list of available trading pairs.
 * @param request The NextRequest object.
 * @returns A NextResponse containing the list of TradingPair objects.
 */
export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  // In a real application, you might fetch this from a configuration service or database.
  // For the mock, we just return the static list.

  return NextResponse.json(MOCK_PAIRS_DATA);
}
