// app/api/trades/route.ts
import { type NextRequest, NextResponse } from 'next/server';

export interface Trade {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

// Mock trades storage (in-memory)
const mockTradesDB: { [symbol: string]: Trade[] } = {};

function generateMockTrades(symbol: string, count: number): Trade[] {
  if (!mockTradesDB[symbol]) {
    const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2500 : 100;

    const trades: Trade[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const priceVariation = (Math.random() - 0.5) * basePrice * 0.01;
      const price = (basePrice + priceVariation).toFixed(2);
      const qty = (Math.random() * 5 + 0.01).toFixed(4);

      trades.push({
        id: `${now - i * 1000}-${Math.random().toString(36).substr(2, 9)}`,
        price,
        qty,
        time: now - i * 1000, // Each trade 1 second apart
        isBuyerMaker: Math.random() > 0.5,
        isBestMatch: Math.random() > 0.3,
      });
    }

    mockTradesDB[symbol] = trades;
  }

  return mockTradesDB[symbol];
}

export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const limit = parseInt(searchParams.get('limit') || '500');
  const user = searchParams.get('user');
  const orderBy = searchParams.get('orderBy') || 'desc';

  // Generate or get cached trades
  let trades = generateMockTrades(symbol, Math.max(limit, 1000));

  // Filter by user if provided
  if (user) {
    // In a real scenario, you'd filter by user address
    // For mock, we'll just return a subset
    trades = trades.filter(() => Math.random() > 0.7);
  }

  // Apply ordering
  if (orderBy === 'asc') {
    trades = [...trades].reverse();
  }

  // Apply limit
  trades = trades.slice(0, limit);

  return NextResponse.json(trades);
}
