import { type NextRequest, NextResponse } from 'next/server';
import { getMockTradingEngine, normalizeSymbol } from '@/lib/mockTradingEngine';

const SUPPORTED_INTERVALS = new Set<('1m' | '5m' | '30m' | '1h' | '1d')>(['1m', '5m', '30m', '1h', '1d']);
const engine = getMockTradingEngine();

export async function GET(request: NextRequest) {
  await engine.wait(130);

  const searchParams = request.nextUrl.searchParams;
  const symbolParam = searchParams.get('symbol');
  const intervalParam = (searchParams.get('interval') as '1m' | '5m' | '30m' | '1h' | '1d') || '1m';
  const limit = parseInt(searchParams.get('limit') || '500', 10);
  const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime') as string, 10) : undefined;
  const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime') as string, 10) : undefined;

  if (!symbolParam) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  if (!SUPPORTED_INTERVALS.has(intervalParam)) {
    return NextResponse.json({ error: `Unsupported interval ${intervalParam}` }, { status: 400 });
  }

  if (Number.isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: 'Limit must be a positive number' }, { status: 400 });
  }

  try {
    const symbol = normalizeSymbol(symbolParam);
    const data = engine.getKlines(symbol, intervalParam, limit, { startTime, endTime });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
