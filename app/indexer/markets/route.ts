import { NextResponse } from 'next/server';
import { getMockTradingEngine } from '@/lib/mockTradingEngine';

const engine = getMockTradingEngine();

export async function GET() {
  await engine.wait(100);
  const markets = engine.getMarkets();
  return NextResponse.json(markets);
}
