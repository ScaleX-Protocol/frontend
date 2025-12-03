import { type NextRequest, NextResponse } from 'next/server';

export interface Order {
  symbol: string;
  orderId: string;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumulativeQuoteQty: string;
  status: string; // e.g., 'FILLED', 'PARTIALLY_FILLED', 'NEW', 'CANCELED'
  timeInForce: string; // e.g., 'GTC', 'IOC', 'FOK'
  type: string; // e.g., 'LIMIT', 'MARKET'
  side: string; // e.g., 'BUY', 'SELL'
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

// Mock orders storage (in-memory, keyed by user address)
const mockOrdersDB: { [address: string]: Order[] } = {};

// Helper function to generate a predictable-but-random number based on a string (address)
// This ensures that the generated orders are consistent for the same user address across requests.
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
 * Generates a list of mock orders for a given user address.
 * Caches the generated data in mockOrdersDB for consistency.
 * @param address The user's wallet address.
 * @param count The number of mock orders to generate.
 * @returns An array of mock Order objects.
 */
function generateMockOrders(address: string, count: number = 200): Order[] {
  if (!mockOrdersDB[address]) {
    // Seed the random generator based on the address to ensure stable mock data
    let seed = hashString(address);
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const orders: Order[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      // Determine symbol, base price, side, and quantity
      const isWETH = pseudoRandom() > 0.5;
      console.log(isWETH);
      const currentSymbol = isWETH ? 'gsWETH/gsUSDC' : 'gsWBTC/gsUSDC';
      const basePrice = isWETH ? 2500 : 45000;

      const priceVariation = (pseudoRandom() - 0.5) * basePrice * 0.05; // +/- 5%
      const price = (basePrice + priceVariation).toFixed(2);
      const side = pseudoRandom() > 0.5 ? 'BUY' : 'SELL';
      const origQty = (pseudoRandom() * 10).toFixed(4);

      // Determine status and execution details
      let status: string;
      let executedQty: string;

      const statusRoll = pseudoRandom();
      if (statusRoll < 0.3) {
        status = 'FILLED';
        executedQty = origQty;
      } else if (statusRoll < 0.6) {
        status = 'NEW';
        executedQty = '0.0000';
      } else if (statusRoll < 0.8) {
        status = 'PARTIALLY_FILLED';
        const execFraction = pseudoRandom() * 0.8 + 0.1; // 10% to 90% filled
        executedQty = (parseFloat(origQty) * execFraction).toFixed(4);
      } else {
        status = 'CANCELED';
        executedQty = (pseudoRandom() * parseFloat(origQty) * 0.5).toFixed(4);
      }

      const origQtyFloat = parseFloat(origQty);
      const executedQtyFloat = parseFloat(executedQty);
      const priceFloat = parseFloat(price);

      const cumulativeQuoteQty = (executedQtyFloat * priceFloat).toFixed(2);
      const origQuoteOrderQty = (origQtyFloat * priceFloat).toFixed(2);

      const timeOffset = i * 60000 * (pseudoRandom() * 5 + 1); // Simulating orders placed over time
      const orderTime = now - timeOffset;

      orders.push({
        symbol: currentSymbol,
        orderId: `${i + 1}${Math.floor(pseudoRandom() * 10000)}`,
        orderListId: i + 1000,
        clientOrderId: `mock_client_${i + 1}`,
        price,
        origQty,
        executedQty,
        cumulativeQuoteQty,
        status,
        timeInForce: pseudoRandom() > 0.8 ? 'FOK' : pseudoRandom() > 0.5 ? 'IOC' : 'GTC',
        type: pseudoRandom() > 0.8 ? 'MARKET' : 'LIMIT',
        side,
        stopPrice: '0.00',
        icebergQty: '0.00',
        time: orderTime,
        updateTime: orderTime + (status !== 'NEW' ? Math.floor(pseudoRandom() * 60000) : 0),
        isWorking: status === 'NEW' || status === 'PARTIALLY_FILLED',
        origQuoteOrderQty,
      });
    }

    // Cache the generated orders
    mockOrdersDB[address] = orders;
  }

  // Orders are generated newest-first, which is typically the default API behavior
  return mockOrdersDB[address];
}

/**
 * Handles GET requests to /api/allOrders.
 * Fetches mock order data based on query parameters (address, symbol, limit).
 * @param request The NextRequest object.
 * @returns A NextResponse containing the filtered and formatted orders.
 */
export async function GET(request: NextRequest) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const symbolQuery = searchParams.get('symbol');
  const limit = parseInt(searchParams.get('limit') || '500', 10);

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  // 1. Generate or get cached orders for the specific user address
  let orders = generateMockOrders(address);

  // 2. Filter by symbol if provided
  if (symbolQuery) {
    orders = orders.filter((order) => order.symbol === symbolQuery);
  }

  // 3. Apply limit (orders are naturally newest-first due to generation logic)
  orders = orders.slice(0, limit);

  // Return the mock data
  return NextResponse.json(orders);
}
