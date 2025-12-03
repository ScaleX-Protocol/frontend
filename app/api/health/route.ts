import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
      chainName: process.env.NEXT_PUBLIC_CHAIN_NAME,
      domain: process.env.NEXT_PUBLIC_DOMAIN,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}