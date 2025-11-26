import { NextResponse } from 'next/server';
import { getMockTradingEngine } from '@/lib/mockTradingEngine';

const engine = getMockTradingEngine();

export async function GET() {
  await engine.wait(80);
  const pairs = engine.getSupportedPairs();
  return NextResponse.json(pairs);
}
