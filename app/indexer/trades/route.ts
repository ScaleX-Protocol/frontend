// app/api/trades/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getMockTradingEngine, normalizeSymbol } from '@/lib/mockTradingEngine';

const engine = getMockTradingEngine();

export async function GET(request: NextRequest) {
  await engine.wait(120);

  const searchParams = request.nextUrl.searchParams;
  const symbolParam = searchParams.get('symbol') || 'gsWBTCgsUSDC';
  const limit = parseInt(searchParams.get('limit') || '500', 10);
  const orderBy = (searchParams.get('orderBy') as 'asc' | 'desc') || 'desc';

  if (Number.isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: 'Limit must be a positive number' }, { status: 400 });
  }

  try {
    const symbol = normalizeSymbol(symbolParam);
    const trades = engine.getTrades(symbol, limit, orderBy);
    return NextResponse.json(trades);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
