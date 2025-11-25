import { type NextRequest, NextResponse } from 'next/server';

// --- Interfaces for K-line Data ---

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  numberOfTrades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
  ignored: string; // Typically unused padding value
}

// Helper function to convert interval string to milliseconds
function intervalToMs(interval: string): number {
  const unit = interval.slice(-1);
  const value = parseInt(interval.slice(0, -1), 10);
  switch (unit) {
    case 'm':
      return value * 60 * 1000; // minutes
    case 'h':
      return value * 60 * 60 * 1000; // hours
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days
    default:
      return 60 * 1000; // Default to 1m
  }
}

// Helper function to generate a predictable-but-random number based on a seed
function pseudoRandomGenerator(initialSeed: number) {
  let seed = initialSeed;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Generates mock K-line data for a specific symbol and interval.
 * @param symbol The trading pair symbol.
 * @param interval The time frame (e.g., '1m', '1h').
 * @param limit The maximum number of data points to generate.
 * @returns An array of mock KlineData objects.
 */
function generateMockKline(symbol: string, interval: string, limit: number): KlineData[] {
  // Always regenerate data if the parameters change, but keep it stable for initial load
  // For a basic mock, we generate fresh data every time to ensure the time range is current,
  // but we can ensure consistency by using the symbol as the seed.

  const intervalMs = intervalToMs(interval);
  let basePrice: number;

  if (symbol.includes('WBTC')) {
    basePrice = 45000;
  } else if (symbol.includes('WETH')) {
    basePrice = 2500;
  } else {
    basePrice = 100;
  }

  // Use the symbol's hash as a seed for deterministic movement
  const symbolHash = Array.from(symbol).reduce((hash, char) => hash + char.charCodeAt(0), 0);
  const pseudoRandom = pseudoRandomGenerator(symbolHash + intervalMs);

  const data: KlineData[] = [];
  let currentTime = Date.now();

  // Set the start time to be a clean multiple of the intervalMs
  currentTime = currentTime - (currentTime % intervalMs);

  // Start from the latest candle and go backwards
  let currentOpen = basePrice + (pseudoRandom() - 0.5) * basePrice * 0.05; // Starting price fluctuation

  for (let i = 0; i < limit; i++) {
    const openTime = currentTime - (limit - 1 - i) * intervalMs;
    const closeTime = openTime + intervalMs - 1;

    // Simulate price movement based on the previous close/current open
    const priceChange = (pseudoRandom() - 0.5) * basePrice * 0.005; // Small random move
    const priceVariance = pseudoRandom() * 0.008; // Max fluctuation percentage around the current open

    const open = currentOpen;
    const close = open + priceChange;
    const high = Math.max(open, close) * (1 + pseudoRandom() * priceVariance);
    const low = Math.min(open, close) * (1 - pseudoRandom() * priceVariance);

    // Clamp high and low to ensure high >= low
    const finalHigh = high.toFixed(2);
    const finalLow = low.toFixed(2);

    // Simulate Volume
    const baseVolume = pseudoRandom() * 1000 * (basePrice / 1000); // Higher volume for lower-priced assets, inversely
    const volume = baseVolume.toFixed(2);
    const quoteVolume = (baseVolume * ((open + close) / 2)).toFixed(2);

    data.push({
      openTime,
      open: open.toFixed(2),
      high: finalHigh,
      low: finalLow,
      close: close.toFixed(2),
      volume,
      closeTime,
      quoteVolume,
      numberOfTrades: Math.floor(pseudoRandom() * 500) + 50,
      takerBuyBaseVolume: (baseVolume * pseudoRandom()).toFixed(2),
      takerBuyQuoteVolume: (parseFloat(quoteVolume) * pseudoRandom()).toFixed(2),
      ignored: '0',
    });

    // Update current open for the next candle
    currentOpen = close;
  }

  return data;
}

/**
 * Handles GET requests to /api/kline.
 * Fetches mock K-line data based on query parameters.
 * @param request The NextRequest object.
 * @returns A NextResponse containing the generated KlineData array.
 */
export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const searchParams = request.nextUrl.searchParams;
  let symbolQuery = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1m';
  const limit = parseInt(searchParams.get('limit') || '500', 10);
  // startTime and endTime are ignored for this simple mock, as we only return the latest 'limit' candles

  if (!symbolQuery) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  // Normalize symbol query if it uses a slash separator (e.g., gsWETH/gsUSDC -> gsWETHgsUSDC)
  if (symbolQuery.includes('/')) {
    symbolQuery = symbolQuery.replace('/', 'gs');
  }

  // Generate the K-line data
  const klineData = generateMockKline(symbolQuery, interval, limit);

  // Return the mock data
  return NextResponse.json(klineData);
}
