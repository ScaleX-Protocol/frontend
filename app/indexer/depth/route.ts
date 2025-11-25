// app/api/depth/route.ts
import { type NextRequest, NextResponse } from 'next/server';

export interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}

// Mock data generator for realistic order book
function generateOrderBook(symbol: string, limit: number): DepthResponse {
  const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2500 : 100;

  const bids: [string, string][] = [];
  const asks: [string, string][] = [];

  // Generate bids (buy orders) - decreasing prices
  for (let i = 0; i < limit; i++) {
    const price = (basePrice - i * basePrice * 0.001).toFixed(2);
    const quantity = (Math.random() * 10 + 0.1).toFixed(4);
    bids.push([price, quantity]);
  }

  // Generate asks (sell orders) - increasing prices
  for (let i = 0; i < limit; i++) {
    const price = (basePrice + i * basePrice * 0.001).toFixed(2);
    const quantity = (Math.random() * 10 + 0.1).toFixed(4);
    asks.push([price, quantity]);
  }

  return {
    lastUpdateId: Date.now(),
    bids,
    asks,
  };
}

export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const limit = parseInt(searchParams.get('limit') || '100');

  // Validate limit
  if (limit > 1000) {
    return NextResponse.json({ error: 'Limit cannot exceed 1000' }, { status: 400 });
  }

  const data = generateOrderBook(symbol, limit);

  return NextResponse.json(data);
}
