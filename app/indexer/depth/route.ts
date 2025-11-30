// app/api/depth/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getMockTradingEngine, normalizeSymbol } from '@/lib/mockTradingEngine';

const engine = getMockTradingEngine();

export async function GET(request: NextRequest) {
  await engine.wait();

  const searchParams = request.nextUrl.searchParams;
  const symbolParam = searchParams.get('symbol') || 'gsWBTCgsUSDC';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  if (Number.isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: 'Limit must be a positive number' }, { status: 400 });
  }

  if (limit > 1000) {
    return NextResponse.json({ error: 'Limit cannot exceed 1000' }, { status: 400 });
  }

  try {
    const symbol = normalizeSymbol(symbolParam);
    const data = engine.getDepth(symbol, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
