import { type NextRequest, NextResponse } from 'next/server';

// --- Interfaces for Account Data ---

export interface Balance {
  token: string; // Token contract address or identifier
  symbol: string; // e.g., 'gsUSDC', 'gsWETH'
  available: number;
  locked: number;
  total: number;
  usdValue: number;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Balance[];
  permissions: string[];
}

// Mock account storage (in-memory, keyed by user address)
const mockAccountDB: { [address: string]: AccountInfo } = {};

// Helper function to generate a predictable-but-random number based on a string (address)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates mock account data for a given user address.
 * Caches the generated data in mockAccountDB for consistency.
 * @param address The user's wallet address.
 * @returns A mock AccountInfo object.
 */
function generateMockAccountInfo(address: string): AccountInfo {
  if (!mockAccountDB[address]) {
    // Seed the random generator based on the address to ensure stable mock data
    let seed = hashString(address);

    // Deterministic pseudo-random number generator (0 to 1)
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const now = Date.now();

    // Define mock balances for common assets
    const mockBalances: Balance[] = [
      {
        token: '0x...usdc',
        symbol: 'gsUSDC',
        available: parseFloat((pseudoRandom() * 5000 + 100).toFixed(2)), // $100 to $5100
        locked: parseFloat((pseudoRandom() * 100).toFixed(2)), // $0 to $100
        total: 0, // Will be calculated below
        usdValue: 0, // Will be calculated below
      },
      {
        token: '0x...weth',
        symbol: 'gsWETH',
        available: parseFloat((pseudoRandom() * 10).toFixed(4)), // 0 to 10 ETH
        locked: parseFloat((pseudoRandom() * 1).toFixed(4)), // 0 to 1 ETH
        total: 0,
        usdValue: 0,
      },
      {
        token: '0x...wbtc',
        symbol: 'gsWBTC',
        available: parseFloat((pseudoRandom() * 0.5).toFixed(6)), // 0 to 0.5 BTC
        locked: parseFloat((pseudoRandom() * 0.05).toFixed(6)), // 0 to 0.05 BTC
        total: 0,
        usdValue: 0,
      },
    ];

    // Simulate current market prices for USD value calculation
    const mockPrices: { [key: string]: number } = {
      gsUSDC: 1.0,
      gsWETH: 2500, // Mock ETH Price
      gsWBTC: 45000, // Mock BTC Price
    };

    // Calculate derived fields (total and usdValue)
    const balancesWithCalculations: Balance[] = mockBalances.map((balance) => {
      const total = balance.available + balance.locked;
      const price = mockPrices[balance.symbol] || 0;
      const usdValue = total * price;

      return {
        ...balance,
        total: parseFloat(total.toFixed(6)),
        usdValue: parseFloat(usdValue.toFixed(2)),
      };
    });

    // Construct the final AccountInfo object
    const accountInfo: AccountInfo = {
      makerCommission: 0.0001,
      takerCommission: 0.0003,
      buyerCommission: 0.0,
      sellerCommission: 0.0,
      canTrade: pseudoRandom() > 0.01, // 99% chance true
      canWithdraw: pseudoRandom() > 0.01,
      canDeposit: true,
      updateTime: now,
      accountType: 'SPOT',
      balances: balancesWithCalculations,
      permissions: ['SPOT', 'MARGIN'],
    };

    // Cache the result
    mockAccountDB[address] = accountInfo;
  }

  return mockAccountDB[address];
}

/**
 * Handles GET requests to /api/account.
 * Fetches mock account info based on the address query parameter.
 * @param request The NextRequest object.
 * @returns A NextResponse containing the mock AccountInfo.
 */
export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  // Generate or retrieve cached account info for the given address
  const accountInfo = generateMockAccountInfo(address);

  // Return the mock data
  return NextResponse.json(accountInfo);
}
